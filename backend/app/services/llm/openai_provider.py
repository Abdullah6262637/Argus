"""OpenAI saglayicisi (async) - tool calling destekli."""
from __future__ import annotations

import json
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


class OpenAIProvider(BaseLLMProvider):
    """OpenAI Chat Completions API + function calling (base_url ile ozel endpoint destekler)."""

    name = "openai"

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "gpt-4o-mini",
        base_url: Optional[str] = None,
    ) -> None:
        super().__init__(api_key=api_key, model=model)
        if not api_key:
            raise LLMError("OPENAI_API_KEY tanimli degil")
        self.base_url = base_url
        try:
            from openai import AsyncOpenAI  # type: ignore
        except ImportError as exc:  # pragma: no cover
            raise LLMError(
                "openai paketi yuklenmemis. `pip install openai` ile kurun."
            ) from exc

        client_kwargs: Dict[str, Any] = {"api_key": api_key}
        if base_url:
            client_kwargs["base_url"] = base_url
        self._client = AsyncOpenAI(**client_kwargs)

    @staticmethod
    def _to_openai_messages(messages: List[ChatMessage]) -> List[Dict[str, Any]]:
        """ChatMessage listesini OpenAI'in bekledigi sozlukgir."""
        out: List[Dict[str, Any]] = []
        for m in messages:
            if m.role == "tool":
                # Tool sonucu mesaji
                out.append({
                    "role": "tool",
                    "tool_call_id": m.tool_call_id or "",
                    "content": m.content})
            elif m.role == "assistant" and m.tool_calls:
                # Asistanin tool cagrisi yaptigi mesaj
                out.append({
                    "role": "assistant",
                    "content": m.content or None,
                    "tool_calls": [
                        {
                            "id": tc.id,
                            "type": "function",
                            "function": {
                                "name": tc.name,
                                "arguments": json.dumps(tc.arguments, ensure_ascii=False)}}
                        for tc in m.tool_calls
                    ]})
            else:
                out.append({"role": m.role, "content": m.content})
        return out

    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> LLMResponse:
        from typing import cast

        payload = self._to_openai_messages(messages)

        call_kwargs: Dict[str, Any] = {
            "model": self.model,
            "messages": cast(Any, payload),
            "temperature": temperature,
            "max_tokens": max_tokens}
        if tools:
            call_kwargs["tools"] = tools
            call_kwargs["tool_choice"] = "auto"

        try:
            completion = await self._client.chat.completions.create(**call_kwargs)
        except Exception as exc:  # pragma: no cover
            exc_str = str(exc).lower()
            is_local = False
            if self.base_url and ("127.0.0.1" in self.base_url or "localhost" in self.base_url):
                is_local = True

            if is_local and ("connection error" in exc_str or "connecterror" in exc_str or "api connection" in exc_str or "clienterror" in exc_str):
                raise LLMError(
                    f"Yerel model sunucusuna ({self.base_url}) bağlanılamadı. "
                    f"Lütfen yerel yapay zeka sunucunuzun (Ollama / LM Studio) arka planda "
                    f"çalıştığından ve '{self.model}' modelinin indirildiğinden emin olun."
                ) from exc
            raise LLMError(f"OpenAI cagrisi basarisiz: {exc}") from exc

        choice = completion.choices[0]
        usage = getattr(completion, "usage", None)
        msg = choice.message

        # Tool call'lari topla
        tool_calls: List[ToolCall] = []
        raw_tcs = getattr(msg, "tool_calls", None) or []
        for tc in raw_tcs:
            try:
                fn = tc.function
                args_str = fn.arguments or "{}"
                args = json.loads(args_str) if args_str else {}
            except (json.JSONDecodeError, AttributeError) as exc:
                logger.warning("Tool argumanlari parse edilemedi: %s", exc)
                args = {}
            tool_calls.append(ToolCall(id=tc.id, name=tc.function.name, arguments=args))

        return LLMResponse(
            content=msg.content or "",
            provider=self.name,
            model=self.model,
            prompt_tokens=getattr(usage, "prompt_tokens", None) if usage else None,
            completion_tokens=getattr(usage, "completion_tokens", None) if usage else None,
            total_tokens=getattr(usage, "total_tokens", None) if usage else None,
            raw=completion.model_dump() if hasattr(completion, "model_dump") else {},
            tool_calls=tool_calls,
            stop_reason=choice.finish_reason,
        )

    async def close(self) -> None:
        close = getattr(self._client, "close", None)
        if close:
            await close()