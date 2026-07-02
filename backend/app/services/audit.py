"""AuditChain: HMAC zincirli, kronolojik tool execution log servisi (FAZ 1.6).

Her kayit:
  - seq: monoton sayac
  - prev_hash: bir onceki kaydin hmac_sig'i
  - hmac_sig: hmac_sha256(secret, f"{seq}|{prev_hash}|{payload_json}")

Verify:
  Tum kayitlari sirayla okuyup hmac'i yeniden hesapla, eslesmeyen yerde zincir bozuk.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import secrets
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import session_scope
from app.models.audit import AuditEntry

logger = logging.getLogger(__name__)


def _ensure_secret() -> bytes:
    """HMAC secret'i config veya yerel dosyadan al; yoksa uret + sakla."""
    settings = get_settings()
    secret = settings.audit_hmac_secret
    if secret:
        return secret.encode("utf-8")

    secret_dir = settings.data_dir / "audit"
    secret_dir.mkdir(parents=True, exist_ok=True)
    secret_file = secret_dir / ".secret"

    if secret_file.exists():
        return secret_file.read_bytes().strip()

    new_secret = secrets.token_hex(32).encode("utf-8")
    secret_file.write_bytes(new_secret)
    try:
        os.chmod(secret_file, 0o600)
    except OSError:
        pass  # Windows
    logger.info("Audit HMAC secret olusturuldu: %s", secret_file)
    return new_secret


class AuditChain:
    """Singleton-benzeri zincir yazici."""

    def __init__(self) -> None:
        self._secret: Optional[bytes] = None
        self._last_seq: int = 0
        self._last_hash: str = ""
        self._initialized: bool = False

    def _secret_bytes(self) -> bytes:
        if self._secret is None:
            self._secret = _ensure_secret()
        return self._secret

    async def _initialize(self, session: AsyncSession) -> None:
        """Son seq'i ve hash'i DB'den yukle."""
        if self._initialized:
            return
        result = await session.execute(
            select(AuditEntry).order_by(desc(AuditEntry.seq)).limit(1)
        )
        last = result.scalar_one_or_none()
        if last:
            self._last_seq = last.seq
            self._last_hash = last.hmac_sig
        self._initialized = True

    @staticmethod
    def _compute_hmac(secret: bytes, seq: int, prev_hash: str, payload_json: str) -> str:
        msg = f"{seq}|{prev_hash}|{payload_json}".encode("utf-8")
        return hmac.new(secret, msg, hashlib.sha256).hexdigest()

    async def append(
        self,
        event_type: str,
        payload: Dict[str, Any],
        agent_id: Optional[str] = None,
    ) -> AuditEntry:
        """Bir denetim kaydi ekle (kendi DB session'ini acar)."""
        secret = self._secret_bytes()
        async with session_scope() as session:
            await self._initialize(session)
            seq = self._last_seq + 1
            payload_json = json.dumps(payload, ensure_ascii=False, default=str, sort_keys=True)
            sig = self._compute_hmac(secret, seq, self._last_hash, payload_json)

            entry = AuditEntry(
                seq=seq,
                agent_id=agent_id,
                event_type=event_type,
                payload_json=payload_json,
                prev_hash=self._last_hash,
                hmac_sig=sig,
            )
            session.add(entry)
            await session.flush()

            self._last_seq = seq
            self._last_hash = sig
            return entry

    async def append_with_session(
        self,
        session: AsyncSession,
        event_type: str,
        payload: Dict[str, Any],
        agent_id: Optional[str] = None,
    ) -> AuditEntry:
        """Mevcut bir session ile zincire ekle (commit edilmesini cagiran yapar)."""
        secret = self._secret_bytes()
        await self._initialize(session)
        seq = self._last_seq + 1
        payload_json = json.dumps(payload, ensure_ascii=False, default=str, sort_keys=True)
        sig = self._compute_hmac(secret, seq, self._last_hash, payload_json)

        entry = AuditEntry(
            seq=seq,
            agent_id=agent_id,
            event_type=event_type,
            payload_json=payload_json,
            prev_hash=self._last_hash,
            hmac_sig=sig,
        )
        session.add(entry)
        await session.flush()

        self._last_seq = seq
        self._last_hash = sig
        return entry

    async def verify_chain(self) -> Tuple[bool, List[str]]:
        """Tum zinciri dogrula. Return: (ok, hata_listesi)."""
        errors: List[str] = []
        secret = self._secret_bytes()
        prev_hash = ""
        expected_seq = 1
        async with session_scope() as session:
            result = await session.execute(
                select(AuditEntry).order_by(AuditEntry.seq.asc())
            )
            entries = list(result.scalars().all())

        for entry in entries:
            if entry.seq != expected_seq:
                errors.append(f"seq atlandi: bekleniyor {expected_seq}, geldi {entry.seq}")
            if entry.prev_hash != prev_hash:
                errors.append(f"seq={entry.seq} prev_hash uyumsuz")
            expected_sig = self._compute_hmac(secret, entry.seq, entry.prev_hash, entry.payload_json)
            if expected_sig != entry.hmac_sig:
                errors.append(f"seq={entry.seq} HMAC uyumsuz (kayit degistirilmis olabilir)")
            prev_hash = entry.hmac_sig
            expected_seq = entry.seq + 1

        return (len(errors) == 0), errors


# Singleton
audit_chain = AuditChain()