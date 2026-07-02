"""Sohbet ile ilgili Pydantic semalari."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatRequest(BaseModel):
    """Kullanicidan gelen sohbet istegi."""

    agent_id: str = Field(..., description="Hedef ajanin kimligi")
    conversation_id: Optional[int] = Field(
        None, description="Mevcut sohbete devam icin; bos ise yenisi acilir"
    )
    content: str = Field(..., min_length=1, max_length=8000)


class ToolCallOut(BaseModel):
    """Bir tool cagrisi sonucu (UI icin)."""

    id: str
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    ok: bool = False
    output: str = ""
    error: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    duration_ms: int = 0


class MessageOut(BaseModel):
    """Mesaj yanit semasi."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    content: str
    tokens: Optional[int] = None
    provider: Optional[str] = None
    model: Optional[str] = None
    created_at: datetime


class ChatResponse(BaseModel):
    """Sohbet istegine donen yanit."""

    conversation_id: int
    user_message: MessageOut
    assistant_message: MessageOut
    tool_calls: List[ToolCallOut] = Field(default_factory=list)
    steps: int = 1


class ConversationOut(BaseModel):
    """Sohbet oturum ozeti."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    agent_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = None


class ConversationDetail(ConversationOut):
    messages: List[MessageOut] = Field(default_factory=list)