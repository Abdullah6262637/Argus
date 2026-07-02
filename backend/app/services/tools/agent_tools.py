"""Agent-to-agent delegasyon tool'u (FAZ 4.1)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class DelegateToAgentTool(BaseTool):
    name = "delegate_to_agent"
    description = (
        "Bir gorevi baska bir ajana devret. Hedef ajan tool'larini kullanarak "
        "gorevi icra eder ve cevabini doner. Hedef ajan zaten zincir icindeyse "
        "hata doner (cycle protection)."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "agent_id": {"type": "string", "description": "Hedef ajan id'si"},
            "prompt": {"type": "string", "description": "Hedef ajana verilecek talimat"},
            "max_steps": {"type": "integer", "default": 6}},
        "required": ["agent_id", "prompt"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        target_id = (args.get("agent_id") or "").strip()
        prompt = (args.get("prompt") or "").strip()
        max_steps = int(args.get("max_steps", 6))

        if not target_id:
            return ToolResult(ok=False, error="agent_id gerekli")
        if not prompt:
            return ToolResult(ok=False, error="prompt gerekli")
        if target_id == context.agent_id:
            return ToolResult(ok=False, error="Kendine delege edemezsin")

        # Cycle koruma
        chain: List[str] = list(context.extra.get("delegation_chain", []) or [])
        if target_id in chain:
            return ToolResult(
                ok=False,
                error=f"Delegasyon cyclesi: {' -> '.join(chain + [target_id])}",
            )
        if len(chain) >= 3:
            return ToolResult(
                ok=False,
                error="Maksimum delegasyon derinligi (3) asildi",
            )

        # Hedef ajani bul
        try:
            from app.services.agent_manager import agent_manager
            target_agent = agent_manager.require(target_id)
        except KeyError:
            return ToolResult(ok=False, error=f"Hedef ajan bulunamadi: {target_id}")
        if not target_agent.is_active:
            return ToolResult(ok=False, error=f"Hedef ajan aktif degil: {target_id}")

        # Run agent loop
        from app.services.agent_loop import run_agent_loop
        from app.services.tools.base import ToolContext as _Ctx

        # Yeni context, chain'i guncelle
        new_extra = dict(context.extra)
        new_extra["delegation_chain"] = chain + [context.agent_id]
        target_ctx = _Ctx(  # noqa: F841 (run_agent_loop kendi context'ini olusturuyor)
            agent_id=target_agent.id,
            agent_name=target_agent.name,
            workspace_dir=context.workspace_dir,
            extra=new_extra,
        )

        try:
            result = await run_agent_loop(
                target_agent,
                history=[],
                user_message=prompt,
                max_steps=max_steps,
            )
        except Exception as exc:
            logger.exception("delegate_to_agent run hatasi")
            return ToolResult(ok=False, error=f"Hedef ajan hatasi: {exc}")

        return ToolResult(
            ok=True,
            output=result.final_content or "(bos cevap)",
            data={
                "target_agent": target_id,
                "tool_calls": [tc.to_dict() for tc in result.tool_calls],
                "steps": result.steps,
                "tokens": result.total_tokens},
        )