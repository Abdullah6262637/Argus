"""Rate limiter (FAZ 7.3): per-provider token/request basina dakika limiti.

Token bucket algoritmasi - in-memory.
"""
from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass
from typing import Dict

from app.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class _Bucket:
    capacity: float
    tokens: float
    refill_per_sec: float
    last_refill: float

    def refill(self) -> None:
        now = time.time()
        delta = now - self.last_refill
        if delta > 0:
            self.tokens = min(self.capacity, self.tokens + delta * self.refill_per_sec)
            self.last_refill = now

    def try_consume(self, amount: float) -> bool:
        self.refill()
        if self.tokens >= amount:
            self.tokens -= amount
            return True
        return False


class RateLimiter:
    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._req_buckets: Dict[str, _Bucket] = {}
        self._tok_buckets: Dict[str, _Bucket] = {}

    def _get_limits(self, provider: str) -> tuple[int, int]:
        settings = get_settings()
        provider = provider.lower()
        if provider == "openai":
            return settings.rate_limit_openai_rpm, settings.rate_limit_openai_tpm
        if provider == "anthropic":
            return settings.rate_limit_anthropic_rpm, settings.rate_limit_anthropic_tpm
        # Default: bol miktarda
        return 120, 300000

    def _get_or_create(self, provider: str) -> tuple[_Bucket, _Bucket]:
        if provider in self._req_buckets:
            return self._req_buckets[provider], self._tok_buckets[provider]

        rpm, tpm = self._get_limits(provider)
        now = time.time()
        req = _Bucket(
            capacity=float(rpm),
            tokens=float(rpm),
            refill_per_sec=float(rpm) / 60.0,
            last_refill=now,
        )
        tok = _Bucket(
            capacity=float(tpm),
            tokens=float(tpm),
            refill_per_sec=float(tpm) / 60.0,
            last_refill=now,
        )
        self._req_buckets[provider] = req
        self._tok_buckets[provider] = tok
        return req, tok

    async def acquire(self, provider: str, est_tokens: int = 1000, *, max_wait: float = 30.0) -> bool:
        """Rate limit'e gore bekle. Return: izin verildi mi (timeout'ta False)."""
        provider = provider.lower()
        deadline = time.time() + max_wait
        sleep_step = 0.25
        while True:
            async with self._lock:
                req, tok = self._get_or_create(provider)
                if req.try_consume(1) and tok.try_consume(max(1, est_tokens)):
                    return True
            if time.time() >= deadline:
                logger.warning("Rate limit timeout: provider=%s, est_tokens=%d", provider, est_tokens)
                return False
            await asyncio.sleep(sleep_step)
            sleep_step = min(2.0, sleep_step * 1.5)

    def stats(self, provider: str) -> Dict[str, float]:
        provider = provider.lower()
        if provider not in self._req_buckets:
            return {}
        r = self._req_buckets[provider]
        t = self._tok_buckets[provider]
        r.refill()
        t.refill()
        return {
            "req_capacity": r.capacity, "req_tokens": r.tokens,
            "tok_capacity": t.capacity, "tok_tokens": t.tokens}


# Singleton
rate_limiter = RateLimiter()