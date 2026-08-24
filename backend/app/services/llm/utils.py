"""LLM yardimci fonksiyonlari - API anahtar dogrulama vb."""
from __future__ import annotations
import re
from typing import Optional

_PLACEHOLDER_PATTERNS = (
    "sk-your", "sk-proj-your", "your-api-key", "your_api_key",
    "placeholder", "xxx", "INSERT", "CHANGE_ME", "...", "xxxxxxxxxx"
)


def is_placeholder_key(key: Optional[str]) -> bool:
    """API anahtarinin placeholder (gecersiz) olup olmadigini kontrol eder."""
    if not key or len(key.strip()) < 8:
        return True
    lower = key.strip().lower()
    return any(p in lower for p in _PLACEHOLDER_PATTERNS)


def mask_api_key(key: str, visible_chars: int = 4) -> str:
    """API anahtarini guvenli sekilde maskeler."""
    if not key or len(key) <= visible_chars:
        return "****"
    return key[:visible_chars] + "*" * (len(key) - visible_chars)
