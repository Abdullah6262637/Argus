"""/api/logs router'i."""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import Log
from app.schemas.log import LogOut

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("", response_model=List[LogOut])
async def list_logs(
    agent_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
) -> List[LogOut]:
    stmt = select(Log).order_by(Log.created_at.desc()).limit(limit)
    if agent_id:
        stmt = stmt.where(Log.agent_id == agent_id)
    result = await session.execute(stmt)
    rows = list(result.scalars().all())
    return [
        LogOut(
            id=r.id,
            agent_id=r.agent_id,
            level=r.level.value if hasattr(r.level, "value") else str(r.level),
            event=r.event,
            payload_json=r.payload_json,
            created_at=r.created_at,
        )
        for r in rows
    ]