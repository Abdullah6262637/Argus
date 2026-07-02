"""AuditEntry modeli - HMAC zincirli tool execution kayitlari (FAZ 1.6)."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class AuditEntry(Base):
    """Kronolojik, imzali bir denetim kaydi.
    
    Her satir, bir onceki satirin hash'ini icerir; HMAC ile imzalanir.
    Boylece sonradan degistirilemez bir zincir olusur.
    """

    __tablename__ = "audit_entries"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    seq: Mapped[int] = mapped_column(Integer, nullable=False, index=True)  # monoton
    agent_id: Mapped[str | None] = mapped_column(String(64), index=True, nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    payload_json: Mapped[str] = mapped_column(Text, nullable=False, default="{}")
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    hmac_sig: Mapped[str] = mapped_column(String(64), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )