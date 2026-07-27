"""Tool sistem soyutlamalari: BaseTool, ToolResult, izin haritasi.

Bir 'tool' agent loop tarafindan LLM'e sunulan ve LLM tarafindan cagrilabilen
bir sistem fonksiyonudur. Her tool:
  - benzersiz bir 'name' tasir
  - LLM'e gosterilecek 'description' ve JSON-Schema 'parameters' tanimlar
  - bir 'permission' bayragi tasir (AgentPermissions alanlarindan biri)
  - 'execute(args, context)' ile asenkron calistirilir ve ToolResult doner
"""
from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Dict, Literal, Optional

logger = logging.getLogger(__name__)


# AgentPermissions alanlarindan biri (file_system, terminal_cmd, web_search, system_admin)
# 'none' = izin gerekmez, herkese aciktir.
PermissionKey = Literal["file_system", "terminal_cmd", "web_search", "system_admin", "none"]


@dataclass
class ToolContext:
    """Tool calistirilirken aktarilan baglam (agent bilgileri vs.)."""

    agent_id: str
    agent_name: str
    workspace_dir: Optional[str] = None  # ileride sandbox icin
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ToolResult:
    """Bir tool calistigi zaman donen sonuc."""

    ok: bool
    output: str = ""  # LLM'e geri verilecek string (kisa olmali)
    error: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)  # ek metadata (UI icin)

    def to_llm_string(self, max_chars: int = 4000) -> str:
        """LLM'e geri donduruleck string formati."""
        if self.ok:
            text = self.output or "(bos cikti)"
        else:
            text = f"HATA: {self.error or 'bilinmeyen hata'}"
        if len(text) > max_chars:
            text = text[: max_chars - 50] + f"\n...[{len(text) - max_chars} karakter kesildi]"
        return text


class BaseTool(ABC):
    """Tum tool'larin uymasi gereken arayuz."""

    name: str = "base_tool"
    description: str = ""
    permission: PermissionKey = "none"
    # JSON Schema for LLM function calling
    parameters: Dict[str, Any] = {
        "type": "object",
        "properties": {},
        "required": []}
    # Eger True ise, kullanicidan onay alinmali (UI'de confirm dialog)
    requires_confirmation: bool = False

    @abstractmethod
    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        """Tool'u verilen argumanlarla calistir."""
        raise NotImplementedError

    async def execute_safe(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        """Tool'u guvenli bir sekilde, sure takibi ve hata yakalama ile calistirir."""
        import time
        start_t = time.perf_counter()
        try:
            res = await self.execute(args, context)
            elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
            if res.data is None:
                res.data = {}
            res.data["execution_time_ms"] = elapsed_ms
            return res
        except Exception as exc:
            elapsed_ms = round((time.perf_counter() - start_t) * 1000, 2)
            logger.exception("Tool execution exception (%s): %s", self.name, exc)
            return ToolResult(
                ok=False,
                error=f"Araç çalıştırma sırasında beklenmeyen hata ({self.name}): {exc}",
                data={"execution_time_ms": elapsed_ms}
            )

    def to_openai_schema(self) -> Dict[str, Any]:
        """OpenAI 'tools' parametresi icin schema uret."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters},
        }

    def to_anthropic_schema(self) -> Dict[str, Any]:
        """Anthropic 'tools' parametresi icin schema uret."""
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.parameters}