"""Planning veri yapilari (in-memory).

Plan ve PlanStep dataclass'lari, agent yurutme dongusu icin runtime'da kullanilir.
Kalici saklama icin SQLAlchemy modelleri ([`backend/app/models/plan.py`](backend/app/models/plan.py:1))
ayrica vardir.
"""
from __future__ import annotations

import enum
import uuid
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional


class StepStatus(str, enum.Enum):
    """Bir plan adiminin durumu."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"
    AWAITING_APPROVAL = "awaiting_approval"


class PlanStatus(str, enum.Enum):
    """Tum plan'in genel durumu."""

    DRAFT = "draft"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


@dataclass(init=True, repr=True, eq=True)
class PlanStep:
    """Bir plan adimi."""

    id: int  # 1-based sira no
    title: str  # kisa baslik (UI'de gorunur)
    description: str  # detayli prompt - agent loop'a gider
    expected_output: str = ""  # ne beklenir (reflector kullanir)
    tool_hints: List[str] = field(default_factory=list)  # onerilen tool isimleri
    status: StepStatus = StepStatus.PENDING
    result: str = ""  # agent'in son cevabi
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)  # [{name, ok, ...}]
    attempts: int = 0
    error: Optional[str] = None
    reflection: Optional[str] = None  # reflector'in geri bildirimi
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    # Sprint F.3: Paralel yurutme bayragi
    # True ise bu step kendisinden sonraki ardisik parallel=True step'lerle
    # birlikte asyncio.gather ile es-zamanli calistirilir.
    # Onceki adimlarin ciktisina BAGLI OLMAYAN step'ler icin uygundur.
    parallel: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "expected_output": self.expected_output,
            "tool_hints": list(self.tool_hints),
            "status": self.status.value,
            "result": self.result,
            "tool_calls": list(self.tool_calls),
            "attempts": self.attempts,
            "error": self.error,
            "reflection": self.reflection,
            "parallel": self.parallel,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None}


@dataclass(init=True, repr=True, eq=True)
class Plan:
    """Bir hedefi adim adim cozmek icin uretilen plan."""

    goal: str
    agent_id: str
    steps: List[PlanStep] = field(default_factory=list)
    status: PlanStatus = PlanStatus.DRAFT
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    conversation_id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    final_summary: str = ""  # tum plan tamamlandiginda son ozet
    error: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "goal": self.goal,
            "agent_id": self.agent_id,
            "conversation_id": self.conversation_id,
            "status": self.status.value,
            "steps": [s.to_dict() for s in self.steps],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "final_summary": self.final_summary,
            "error": self.error,
            "metadata": dict(self.metadata)}

    def current_step(self) -> Optional[PlanStep]:
        """Su an calisan veya bir sonraki bekleyen step."""
        for step in self.steps:
            if step.status == StepStatus.RUNNING:
                return step
        for step in self.steps:
            if step.status == StepStatus.PENDING:
                return step
        return None

    def is_finished(self) -> bool:
        return self.status in (
            PlanStatus.COMPLETED,
            PlanStatus.FAILED,
            PlanStatus.CANCELLED,
        )