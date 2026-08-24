"""DreamRecord ORM model for persisting dreams in the existing database."""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class DreamRecord(Base):
    """Persistent storage for dream objects.

    Integrates with the existing Memory Foundation database.
    Dreams are NEVER authoritative facts — the epistemic_state
    column enforces this at the data layer.
    """

    __tablename__ = "dreams"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)  # uuid4
    parent_dream_id: Mapped[str | None] = mapped_column(
        String(40), nullable=True, index=True
    )
    agent_id: Mapped[str | None] = mapped_column(
        String(64), nullable=True, index=True
    )
    source_episode_ids_json: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    generation_method: Mapped[str] = mapped_column(
        String(30), nullable=False, default="replay"
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )
    epistemic_state: Mapped[str] = mapped_column(
        String(30), nullable=False, default="synthetic"
    )
    assumptions_json: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    modified_variables_json: Mapped[str] = mapped_column(
        Text, nullable=False, default="{}"
    )
    actions_json: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    observations_json: Mapped[str] = mapped_column(
        Text, nullable=False, default="[]"
    )
    outcome: Mapped[str] = mapped_column(Text, default="")
    context_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    score_json: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Numeric score columns for efficient querying/sorting
    novelty: Mapped[float] = mapped_column(Float, default=0.0)
    utility: Mapped[float] = mapped_column(Float, default=0.0)
    plausibility: Mapped[float] = mapped_column(Float, default=0.0)
    composite_value: Mapped[float] = mapped_column(
        Float, default=0.0, index=True
    )

    depth: Mapped[int] = mapped_column(Integer, default=0)
    branch_index: Mapped[int] = mapped_column(Integer, default=0)
    generation_tokens: Mapped[int] = mapped_column(Integer, default=0)
    generation_time_ms: Mapped[float] = mapped_column(Float, default=0.0)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    cluster_id: Mapped[str | None] = mapped_column(
        String(40), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
        nullable=False, index=True
    )
