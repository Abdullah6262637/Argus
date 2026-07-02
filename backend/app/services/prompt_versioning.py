"""Sprint F.5: Prompt versioning — soul/system_prompt degisikliklerini snapshot al.

agent_manager.update_agent icinde prompt degistiyse otomatik olarak
PromptVersion tablosuna yeni bir kayit ekler.
"""
from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy import desc, select

from app.database import session_scope
from app.models.prompt_version import PromptVersion

logger = logging.getLogger(__name__)


async def snapshot_prompt(
    *,
    agent_id: str,
    content: str,
    soul_file: Optional[str] = None,
    created_by: Optional[str] = None,
) -> Optional[PromptVersion]:
    """Bir ajan icin prompt snapshot al. Ayni icerik en son version ile aynıysa skip eder."""
    if not agent_id or not (content or "").strip():
        return None

    async with session_scope() as session:
        # Son version'i bul
        result = await session.execute(
            select(PromptVersion)
            .where(PromptVersion.agent_id == agent_id)
            .order_by(desc(PromptVersion.version))
            .limit(1)
        )
        last = result.scalar_one_or_none()

        if last and last.content == content and last.soul_file == soul_file:
            # Degisiklik yok, skip
            return None

        new_version = (last.version + 1) if last else 1
        rec = PromptVersion(
            agent_id=agent_id,
            version=new_version,
            content=content,
            soul_file=soul_file,
            created_by=created_by,
        )
        session.add(rec)
        await session.flush()
        logger.info(
            "Prompt snapshot alindi: agent=%s version=%d (%d char)",
            agent_id, new_version, len(content),
        )
        return rec


async def list_versions(agent_id: str, limit: int = 50) -> list[PromptVersion]:
    """Bir ajan icin tum prompt versiyonlarini son->ilk sirayla listeler."""
    async with session_scope() as session:
        result = await session.execute(
            select(PromptVersion)
            .where(PromptVersion.agent_id == agent_id)
            .order_by(desc(PromptVersion.version))
            .limit(limit)
        )
        return list(result.scalars().all())


async def get_version(agent_id: str, version: int) -> Optional[PromptVersion]:
    async with session_scope() as session:
        result = await session.execute(
            select(PromptVersion).where(
                PromptVersion.agent_id == agent_id,
                PromptVersion.version == version,
            )
        )
        return result.scalar_one_or_none()