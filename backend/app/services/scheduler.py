"""APScheduler entegrasyonu - zamanlanmis gorevler."""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select

from app.database import session_scope
from app.models import Log, LogLevel, ScheduledTask
from app.services.chat_service import send_message
from app.websocket import connection_manager

logger = logging.getLogger(__name__)

_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="UTC")
    return _scheduler


async def _run_task_job(task_id: int) -> None:
    """Bir zamanlanmis gorevi calistirir."""
    async with session_scope() as session:
        result = await session.execute(
            select(ScheduledTask).where(ScheduledTask.id == task_id)
        )
        task = result.scalar_one_or_none()
        if not task or not task.enabled:
            logger.info("Gorev %s pasif/silinmis, atlandi", task_id)
            return

        try:
            _, _, assistant_msg = await send_message(
                session, task.agent_id, task.prompt
            )
            now = datetime.now(timezone.utc)
            task.last_run_at = now
            task.last_result = (assistant_msg.content or "")[:500]
            session.add(task)
            session.add(
                Log(
                    agent_id=task.agent_id,
                    level=LogLevel.INFO,
                    event="scheduled_task_executed",
                    payload_json=f'{{"task_id": {task.id}, "name": "{task.name}"}}',
                )
            )
            await connection_manager.broadcast(
                {
                    "type": "task_executed",
                    "task_id": task.id,
                    "agent_id": task.agent_id,
                    "name": task.name,
                    "at": now.isoformat(),
                }
            )
        except Exception as exc:
            logger.exception("Gorev calistirma basarisiz (id=%s): %s", task_id, exc)
            session.add(
                Log(
                    agent_id=task.agent_id,
                    level=LogLevel.ERROR,
                    event="scheduled_task_failed",
                    payload_json=f'{{"task_id": {task.id}, "error": "{exc}"}}',
                )
            )


def schedule_task(task: ScheduledTask) -> None:
    """Gorevi scheduler'a ekler (veya gunceller)."""
    scheduler = get_scheduler()
    job_id = f"task-{task.id}"
    try:
        scheduler.remove_job(job_id)
    except Exception:
        pass

    if not task.enabled:
        return

    try:
        trigger = CronTrigger.from_crontab(task.cron_expr, timezone="UTC")
    except Exception as exc:
        logger.error("Gecersiz cron ifadesi (task %s): %s -> %s", task.id, task.cron_expr, exc)
        return

    scheduler.add_job(
        _run_task_job,
        trigger=trigger,
        id=job_id,
        args=[task.id],
        replace_existing=True,
        misfire_grace_time=60,
    )
    logger.info("Gorev scheduler'a eklendi: %s (%s)", task.name, task.cron_expr)


def remove_task_job(task_id: int) -> None:
    scheduler = get_scheduler()
    try:
        scheduler.remove_job(f"task-{task_id}")
    except Exception:
        pass


async def start_scheduler_with_db() -> None:
    """Baslangicta DB'den aktif gorevleri yukler ve scheduler'i baslatir."""
    scheduler = get_scheduler()
    async with session_scope() as session:
        result = await session.execute(select(ScheduledTask).where(ScheduledTask.enabled.is_(True)))
        tasks = list(result.scalars().all())

    for t in tasks:
        schedule_task(t)

    if not scheduler.running:
        scheduler.start()
        logger.info("Scheduler basladi, %d aktif gorev var", len(tasks))


async def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler durduruldu")
    _scheduler = None