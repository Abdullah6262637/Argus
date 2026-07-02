"""LLM saglayici icin ortak soyutlama."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional


Role = Literal["system", "user", "assistant", "tool"]


@dataclass
class ToolCall:
    """LLM'in cagirmaya karar verdigi bir tool kaydi."""

    id: str  # provider tarafindan verilen unique id
    name: str
    arguments: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ChatMessage:
    """Saglayicilar arasi tasinabilen normalize mesaj yapisi."""

    role: Role
    content: str = ""
    # Asistan mesaji ise bu cagirilmasi istenen tool'lar olabilir
    tool_calls: List[ToolCall] = field(default_factory=list)
    # role == 'tool' ise hangi tool_call'a yanit oldugunu belirtir
    tool_call_id: Optional[str] = None
    # role == 'tool' ise hangi tool'un sonucu (anthropic icin gerekli)
    tool_name: Optional[str] = None


@dataclass
class LLMResponse:
    """Modelden donen yanit. Tool cagrisi varsa stop_reason='tool_use'."""

    content: str
    provider: str
    model: str
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    raw: dict = field(default_factory=dict)
    tool_calls: List[ToolCall] = field(default_factory=list)
    stop_reason: Optional[str] = None  # 'stop', 'tool_use', 'length' vb.


class LLMError(Exception):
    """LLM cagrilarinda meydana gelen hatalar icin ortak hata tipi."""


class BaseLLMProvider(ABC):
    """Tum LLM saglayicilarinin uymasi gereken arayuz."""

    name: str = "base"

    def __init__(self, api_key: Optional[str] = None, model: str = "") -> None:
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> LLMResponse:
        """Sohbet mesajlarini modele iletip yanit doner.
        
        tools: provider-spesifik formatda schema listesi (ToolRegistry'den).
        """
        raise NotImplementedError

    async def close(self) -> None:
        """Istemci kapatma - alt siniflar override edebilir."""
        return None