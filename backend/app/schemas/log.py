"""Log Pydantic semalari."""
from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_id: Optional[str] = None
    level: str
    event: str
    payload_json: Optional[str] = None
    created_at: datetime