"""Anthropic (Claude) saglayicisi - tool use destekli."""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.services.llm.base import (
    BaseLLMProvider,
    ChatMessage,
    LLMError,
    LLMResponse,
    ToolCall,
)

logger = logging.getLogger(__name__)


class AnthropicProvider(BaseLLMProvider):
    name = "anthropic"

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "claude-3-5-sonnet-latest",
        base_url: Optional[str] = None,
    ) -> None:
        super().__init__(api_key=api_key, model=model)
        if not api_key:
            raise LLMError("ANTHROPIC_API_KEY tanimli degil")
        self.base_url = base_url
        try:
            from anthropic import AsyncAnthropic  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise LLMError(
                "anthropic paketi yuklenmemis. `pip install anthropic` ile kurun."
            ) from exc

        client_kwargs: Dict[str, Any] = {"api_key": api_key}
        if base_url:
            normalized_url = base_url.rstrip("/")
            if normalized_url.endswith("/v1"):
                normalized_url = normalized_url[:-3]
            client_kwargs["base_url"] = normalized_url
        self._client = AsyncAnthropic(**client_kwargs)

    @staticmethod
    def _build_messages(messages: List[ChatMessage]) -> tuple[Optional[str], List[Dict[str, Any]]]:
        """ChatMessage listesini Anthropic formatina cevir; (system, messages) ikilisi doner."""
        system_parts: List[str] = []
        out: List[Dict[str, Any]] = []

        for m in messages:
            if m.role == "system":
                system_parts.append(m.content)
                continue

            if m.role == "tool":
                # tool sonucu -> user mesaji icinde tool_result blogu
                out.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": m.tool_call_id or "",
                            "content": m.content}
                    ]})
                continue

            if m.role == "assistant" and m.tool_calls:
                # asistanin tool cagrisi (tool_use blogu)
                blocks: List[Dict[str, Any]] = []
                if m.content:
                    blocks.append({"type": "text", "text": m.content})
                for tc in m.tool_calls:
                    blocks.append({
                        "type": "tool_use",
                        "id": tc.id,
                        "name": tc.name,
                        "input": tc.arguments})
                out.append({"role": "assistant", "content": blocks})
                continue

            # Sade text mesaj
            out.append({"role": m.role, "content": m.content})

        system_prompt = "\n\n".join(system_parts) if system_parts else None
        return system_prompt, out

    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> LLMResponse:
        system_prompt, msg_list = self._build_messages(messages)

        call_kwargs: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": msg_list}
        if system_prompt:
            call_kwargs["system"] = system_prompt
        if tools:
            call_kwargs["tools"] = tools

        try:
            response = await self._client.messages.create(**call_kwargs)
        except Exception as exc:  # pragma: no cover
            raise LLMError(f"Anthropic cagrisi basarisiz: {exc}") from exc

        text_parts: List[str] = []
        tool_calls: List[ToolCall] = []

        for block in response.content:
            btype = getattr(block, "type", None)
            if btype == "text":
                text_parts.append(block.text)
            elif btype == "tool_use":
                tool_calls.append(
                    ToolCall(
                        id=getattr(block, "id", ""),
                        name=getattr(block, "name", ""),
                        arguments=dict(getattr(block, "input", {}) or {}),
                    )
                )

        content = "".join(text_parts)

        usage = getattr(response, "usage", None)
        in_t = getattr(usage, "input_tokens", None) if usage else None
        out_t = getattr(usage, "output_tokens", None) if usage else None
        total = (in_t or 0) + (out_t or 0) if (in_t or out_t) else None

        return LLMResponse(
            content=content,
            provider=self.name,
            model=self.model,
            prompt_tokens=in_t,
            completion_tokens=out_t,
            total_tokens=total,
            raw=response.model_dump() if hasattr(response, "model_dump") else {},
            tool_calls=tool_calls,
            stop_reason=getattr(response, "stop_reason", None),
        )

    async def close(self) -> None:
        close = getattr(self._client, "close", None)
        if close:
            await close()