"""/api/tasks router'i - zamanlanmis gorev CRUD."""
from __future__ import annotations

from typing import List

from apscheduler.triggers.cron import CronTrigger
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import ScheduledTask
from app.schemas.task import (
    ScheduledTaskCreate,
    ScheduledTaskOut,
    ScheduledTaskUpdate,
)
from app.services.agent_manager import agent_manager
from app.services.chat_service import send_message
from app.services.scheduler import remove_task_job, schedule_task
from datetime import datetime, timezone

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def _validate_cron(expr: str) -> None:
    try:
        CronTrigger.from_crontab(expr)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Gecersiz cron ifadesi: {exc}")


@router.get("", response_model=List[ScheduledTaskOut])
async def list_tasks(
    session: AsyncSession = Depends(get_session),
) -> List[ScheduledTaskOut]:
    result = await session.execute(select(ScheduledTask).order_by(ScheduledTask.id.desc()))
    return [ScheduledTaskOut.model_validate(t) for t in result.scalars().all()]


@router.post("", response_model=ScheduledTaskOut, status_code=201)
async def create_task(
    payload: ScheduledTaskCreate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledTaskOut:
    if not agent_manager.get(payload.agent_id):
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")
    _validate_cron(payload.cron_expr)

    task = ScheduledTask(**payload.model_dump())
    session.add(task)
    await session.commit()
    await session.refresh(task)

    schedule_task(task)
    return ScheduledTaskOut.model_validate(task)


@router.get("/{task_id}", response_model=ScheduledTaskOut)
async def get_task(
    task_id: int, session: AsyncSession = Depends(get_session)
) -> ScheduledTaskOut:
    task = (
        await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
    ).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Gorev bulunamadi")
    return ScheduledTaskOut.model_validate(task)


@router.patch("/{task_id}", response_model=ScheduledTaskOut)
async def update_task(
    task_id: int,
    payload: ScheduledTaskUpdate,
    session: AsyncSession = Depends(get_session),
) -> ScheduledTaskOut:
    task = (
        await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
    ).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Gorev bulunamadi")

    data = payload.model_dump(exclude_unset=True)
    if "cron_expr" in data:
        _validate_cron(data["cron_expr"])

    for key, value in data.items():
        setattr(task, key, value)

    await session.commit()
    await session.refresh(task)

    # Scheduler'i guncelle
    schedule_task(task)
    return ScheduledTaskOut.model_validate(task)


@router.delete("/{task_id}", status_code=204)
async def delete_task(
    task_id: int, session: AsyncSession = Depends(get_session)
) -> None:
    task = (
        await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
    ).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Gorev bulunamadi")

    await session.delete(task)
    await session.commit()
    remove_task_job(task_id)


@router.post("/{task_id}/run", response_model=ScheduledTaskOut)
async def run_task_now(
    task_id: int, session: AsyncSession = Depends(get_session)
) -> ScheduledTaskOut:
    """Gorevi anında elle tetikler."""
    task = (
        await session.execute(select(ScheduledTask).where(ScheduledTask.id == task_id))
    ).scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Gorev bulunamadi")
    if not agent_manager.get(task.agent_id):
        raise HTTPException(status_code=400, detail="Ajan mevcut degil")

    try:
        _, _, assistant_msg, _ = await send_message(
            session, task.agent_id, task.prompt
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gorev calistirilamadi: {exc}")

    task.last_run_at = datetime.now(timezone.utc)
    task.last_result = (assistant_msg.content or "")[:500]
    await session.commit()
    await session.refresh(task)
    return ScheduledTaskOut.model_validate(task)