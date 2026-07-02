"""Sprint F.2: SkillExtractor — basarili tool zincirlerini SkillRecord'a kaydet.

Bir Plan COMPLETED bittiginde executor.py tarafindan cagrilir.
Tool zinciri 3+ ise "skill candidate" olarak DB'ye yazilir; ayni hash
N kez tekrarlandiginda is_macro=True isaretlenir.
"""
from __future__ import annotations

import hashlib
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from sqlalchemy import select

from app.database import session_scope
from app.models.skill import SkillRecord

logger = logging.getLogger(__name__)


# N kez tekrarlandiginda macro'ya yukseltme esigi
MACRO_PROMOTION_THRESHOLD = 3
# Min tool zinciri uzunlugu
MIN_CHAIN_LEN = 3


def _chain_hash(tool_chain: List[Dict[str, Any]]) -> str:
    """Tool zincirini deterministik hashe cevir (sadece tool isimleri)."""
    names = [str(t.get("name") or "") for t in tool_chain]
    h = hashlib.sha1("|".join(names).encode("utf-8")).hexdigest()[:16]
    return h


async def record_successful_chain(
    *,
    agent_id: str,
    tool_chain: List[Dict[str, Any]],
    goal: Optional[str] = None,
) -> Optional[SkillRecord]:
    """Basarili bir plan tool zincirini skills tablosuna kaydet.

    - Aynı hash zaten varsa success_count++, last_used guncelle
    - Yeni ise SkillRecord olustur
    - Threshold gecilirse is_macro=True yap
    """
    if not tool_chain or len(tool_chain) < MIN_CHAIN_LEN:
        return None

    chash = _chain_hash(tool_chain)
    name = f"skill_{chash}"

    async with session_scope() as session:
        result = await session.execute(
            select(SkillRecord).where(SkillRecord.name == name)
        )
        rec = result.scalar_one_or_none()

        if rec:
            rec.success_count += 1
            rec.last_used_at = datetime.utcnow()
            if not rec.is_macro and rec.success_count >= MACRO_PROMOTION_THRESHOLD:
                rec.is_macro = True
                logger.info("Skill macro'ya yukseltildi: %s (count=%d)", name, rec.success_count)
            return rec

        # Yeni kayit
        # Tool zincirinden kompakt bir aciklama
        names = [str(t.get("name") or "?") for t in tool_chain]
        desc = f"{' → '.join(names[:5])}{' ...' if len(names) > 5 else ''}"
        if goal:
            desc = f"[{goal[:40]}] {desc}"

        new_rec = SkillRecord(
            name=name,
            description=desc,
            agent_id=agent_id,
            tool_chain_json=json.dumps(tool_chain, ensure_ascii=False, default=str),
            success_count=1,
            is_macro=False,
            is_active=True,
            last_used_at=datetime.utcnow(),
        )
        session.add(new_rec)
        await session.flush()
        logger.info("Yeni skill kaydedildi: %s (agent=%s, len=%d)", name, agent_id, len(tool_chain))
        return new_rec