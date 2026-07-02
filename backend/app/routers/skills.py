"""/api/skills router - Learned skills yönetimi."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.skill import SkillRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/skills", tags=["skills"])


@router.get("")
async def list_skills(
    agent_id: Optional[str] = Query(None),
    is_macro: Optional[bool] = Query(None),
    is_active: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Learned skills listesini döndür."""
    try:
        query = select(SkillRecord).order_by(desc(SkillRecord.success_count), desc(SkillRecord.updated_at))
        
        if agent_id:
            query = query.where(SkillRecord.agent_id == agent_id)
        if is_macro is not None:
            query = query.where(SkillRecord.is_macro == is_macro)
        if is_active is not None:
            query = query.where(SkillRecord.is_active == is_active)
        
        query = query.limit(limit)
        
        result = await session.execute(query)
        skills = list(result.scalars().all())
        
        return {
            "skills": [
                {
                    "id": s.id,
                    "name": s.name,
                    "description": s.description,
                    "agent_id": s.agent_id,
                    "tool_chain": json.loads(s.tool_chain_json) if s.tool_chain_json else [],
                    "success_count": s.success_count,
                    "is_macro": s.is_macro,
                    "is_active": s.is_active,
                    "last_used_at": s.last_used_at.isoformat() if s.last_used_at else None,
                    "created_at": s.created_at.isoformat() if s.created_at else None,
                    "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                }
                for s in skills
            ],
            "total": len(skills),
        }
    except Exception as exc:
        logger.exception("Skills listesi okuma hatasi")
        raise HTTPException(500, f"Skills okuma hatasi: {exc}")


@router.get("/{skill_id}")
async def get_skill(
    skill_id: int,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Tek bir skill'in detayını döndür."""
    try:
        result = await session.execute(
            select(SkillRecord).where(SkillRecord.id == skill_id)
        )
        skill = result.scalar_one_or_none()
        
        if not skill:
            raise HTTPException(404, f"Skill {skill_id} bulunamadi")
        
        return {
            "id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "agent_id": skill.agent_id,
            "tool_chain": json.loads(skill.tool_chain_json) if skill.tool_chain_json else [],
            "success_count": skill.success_count,
            "is_macro": skill.is_macro,
            "is_active": skill.is_active,
            "last_used_at": skill.last_used_at.isoformat() if skill.last_used_at else None,
            "created_at": skill.created_at.isoformat() if skill.created_at else None,
            "updated_at": skill.updated_at.isoformat() if skill.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Skill okuma hatasi")
        raise HTTPException(500, f"Skill okuma hatasi: {exc}")


@router.patch("/{skill_id}")
async def update_skill(
    skill_id: int,
    payload: Dict[str, Any],
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Skill'i güncelle (is_active, description, vb.)."""
    try:
        result = await session.execute(
            select(SkillRecord).where(SkillRecord.id == skill_id)
        )
        skill = result.scalar_one_or_none()
        
        if not skill:
            raise HTTPException(404, f"Skill {skill_id} bulunamadi")
        
        if "is_active" in payload:
            skill.is_active = bool(payload["is_active"])
        if "description" in payload:
            skill.description = payload["description"]
        if "is_macro" in payload:
            skill.is_macro = bool(payload["is_macro"])
        
        await session.commit()
        await session.refresh(skill)
        
        return {
            "id": skill.id,
            "name": skill.name,
            "description": skill.description,
            "agent_id": skill.agent_id,
            "tool_chain": json.loads(skill.tool_chain_json) if skill.tool_chain_json else [],
            "success_count": skill.success_count,
            "is_macro": skill.is_macro,
            "is_active": skill.is_active,
            "last_used_at": skill.last_used_at.isoformat() if skill.last_used_at else None,
            "created_at": skill.created_at.isoformat() if skill.created_at else None,
            "updated_at": skill.updated_at.isoformat() if skill.updated_at else None,
        }
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Skill güncelleme hatasi")
        raise HTTPException(500, f"Skill güncelleme hatasi: {exc}")


@router.delete("/{skill_id}")
async def delete_skill(
    skill_id: int,
    session: AsyncSession = Depends(get_session),
) -> Dict[str, Any]:
    """Skill'i sil."""
    try:
        result = await session.execute(
            select(SkillRecord).where(SkillRecord.id == skill_id)
        )
        skill = result.scalar_one_or_none()
        
        if not skill:
            raise HTTPException(404, f"Skill {skill_id} bulunamadi")
        
        await session.delete(skill)
        await session.commit()
        
        return {"ok": True, "message": f"Skill {skill_id} silindi"}
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Skill silme hatasi")
        raise HTTPException(500, f"Skill silme hatasi: {exc}")