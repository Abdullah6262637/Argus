"""Sprint F.2: SkillRecord — basarili tool zincirlerini macro tool olarak hatirla.

Bir Plan basarili bittiginde tool sequence'i cikarilip burada saklanir.
N kez tekrarlandiginda otomatik bir "macro tool" olarak registry'ye eklenebilir.
"""
from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, Dict, List

from sqlalchemy import DateTime, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class SkillRecord(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String(80), index=True, nullable=True)

    # Tool zinciri JSON: [{"name": "...", "args_schema_hint": {...}}, ...]
    tool_chain_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")

    success_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1, index=True)
    is_macro: Mapped[bool] = mapped_column(default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )