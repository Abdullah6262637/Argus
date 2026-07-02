"""Plan ve PlanStep ORM modelleri (kalici saklama)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PlanRecord(Base):
    """Bir gorev plani."""

    __tablename__ = "plans"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # uuid4
    agent_id: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    conversation_id: Mapped[int | None] = mapped_column(Integer, nullable=True, index=True)
    goal: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    steps_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    final_summary: Mapped[str] = mapped_column(Text, default="")
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Sprint F.4: FAIL durumunda root-cause analizi (LLM tarafindan uretilir)
    failure_analysis_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )