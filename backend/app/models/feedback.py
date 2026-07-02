"""Sprint E.5: MessageFeedback modeli — kullanici 👍/👎 reaksiyonlari.

Fine-tune dataset olusturmak veya UI'da rating gostermek icin kullanilir.
"""
from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Enum as SAEnum, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class FeedbackRating(str, enum.Enum):
    UP = "up"
    DOWN = "down"


class MessageFeedback(Base):
    __tablename__ = "message_feedback"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    message_id: Mapped[int] = mapped_column(
        ForeignKey("messages.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    rating: Mapped[FeedbackRating] = mapped_column(
        SAEnum(FeedbackRating, name="feedback_rating"), nullable=False
    )
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )