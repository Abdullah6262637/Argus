"""/api/approvals router - HITL onay kuyrugu API'si."""
from __future__ import annotations

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models.approval import PendingApproval
from app.schemas.approval import ApprovalDecision, ApprovalOut
from app.services.approval_service import approval_service

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def _to_out(record: PendingApproval) -> ApprovalOut:
    try:
        args = json.loads(record.arguments_json or "{}")
    except json.JSONDecodeError:
        args = {}
    return ApprovalOut(
        id=record.id,
        agent_id=record.agent_id,
        conversation_id=record.conversation_id,
        plan_id=record.plan_id,
        step_id=record.step_id,
        tool_name=record.tool_name,
        arguments=args,
        risk_level=record.risk_level,
        status=record.status,
        reason=record.reason,
        decided_by=record.decided_by,
        created_at=record.created_at,
        decided_at=record.decided_at,
    )


@router.get("", response_model=List[ApprovalOut])
async def list_approvals(
    status: Optional[str] = Query(None, description="pending|approved|rejected|timeout"),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
) -> List[ApprovalOut]:
    stmt = select(PendingApproval).order_by(desc(PendingApproval.created_at)).limit(limit)
    if status:
        stmt = stmt.where(PendingApproval.status == status)
    result = await session.execute(stmt)
    return [_to_out(r) for r in result.scalars().all()]


@router.get("/pending", response_model=List[ApprovalOut])
async def list_pending(
    session: AsyncSession = Depends(get_session),
) -> List[ApprovalOut]:
    result = await session.execute(
        select(PendingApproval)
        .where(PendingApproval.status == "pending")
        .order_by(PendingApproval.created_at.asc())
    )
    return [_to_out(r) for r in result.scalars().all()]


@router.get("/{approval_id}", response_model=ApprovalOut)
async def get_approval(
    approval_id: int,
    session: AsyncSession = Depends(get_session),
) -> ApprovalOut:
    result = await session.execute(
        select(PendingApproval).where(PendingApproval.id == approval_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Onay kaydi bulunamadi")
    return _to_out(record)


@router.post("/{approval_id}/approve", response_model=ApprovalOut)
async def approve(
    approval_id: int,
    payload: ApprovalDecision = ApprovalDecision(),
    session: AsyncSession = Depends(get_session),
) -> ApprovalOut:
    ok = await approval_service.decide(
        approval_id, approved=True,
        reason=payload.reason, decided_by=payload.decided_by or "user",
        modified_arguments=payload.arguments,
    )
    if not ok:
        raise HTTPException(404, "Onay kaydi bulunamadi")
    result = await session.execute(
        select(PendingApproval).where(PendingApproval.id == approval_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Onay kaydi bulunamadi")
    return _to_out(record)


@router.post("/{approval_id}/reject", response_model=ApprovalOut)
async def reject(
    approval_id: int,
    payload: ApprovalDecision = ApprovalDecision(),
    session: AsyncSession = Depends(get_session),
) -> ApprovalOut:
    ok = await approval_service.decide(
        approval_id, approved=False,
        reason=payload.reason, decided_by=payload.decided_by or "user",
    )
    if not ok:
        raise HTTPException(404, "Onay kaydi bulunamadi")
    result = await session.execute(
        select(PendingApproval).where(PendingApproval.id == approval_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(404, "Onay kaydi bulunamadi")
    return _to_out(record)