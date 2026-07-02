"""PendingApproval Pydantic semalari."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class ApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_id: str
    conversation_id: Optional[int] = None
    plan_id: Optional[str] = None
    step_id: Optional[int] = None
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    risk_level: str
    status: str
    reason: Optional[str] = None
    decided_by: Optional[str] = None
    created_at: datetime
    decided_at: Optional[datetime] = None


class ApprovalDecision(BaseModel):
    """Onay/Red karari."""

    reason: Optional[str] = None
    decided_by: Optional[str] = "user"
    arguments: Optional[Dict[str, Any]] = None