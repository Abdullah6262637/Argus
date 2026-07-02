"""Zamanlanmis gorev Pydantic semalari."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ScheduledTaskBase(BaseModel):
    agent_id: str
    name: str = Field(..., min_length=1, max_length=255)
    cron_expr: str = Field(
        ...,
        description="Cron ifadesi (dk sa gun ay hgun). Ornek: '0 9 * * *' her gun 09:00",
    )
    prompt: str = Field(..., min_length=1)
    enabled: bool = True


class ScheduledTaskCreate(ScheduledTaskBase):
    """Yeni gorev olusturma payload'u."""


class ScheduledTaskUpdate(BaseModel):
    """Kismi guncelleme payload'u."""

    name: Optional[str] = None
    cron_expr: Optional[str] = None
    prompt: Optional[str] = None
    enabled: Optional[bool] = None


class ScheduledTaskOut(ScheduledTaskBase):
    """Gorev cikti semasi."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    last_run_at: Optional[datetime] = None
    last_result: Optional[str] = None
    created_at: datetime