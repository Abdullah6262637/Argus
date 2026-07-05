"""Google Gemini saglayicisi (async).

Gemini API'sini google-generativeai SDK üzerinden kullanır.
Function calling (tool use) Gemini 1.5+ ile desteklenir.
"""
from __future__ import annotations

import asyncio
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


class GeminiProvider(BaseLLMProvider):
    """Google Gemini Chat API + tool calling."""

    name = "gemini"

    def __init__(
        self,
        api_key: Optional[str],
        model: str = "gemini-1.5-pro",
        base_url: Optional[str] = None,  # ignore (compatibility)
    ) -> None:
        super().__init__(api_key=api_key, model=model)
        if not api_key:
            raise LLMError("GEMINI_API_KEY tanimli degil")
        try:
            import google.generativeai as genai  # type: ignore  # pyright: ignore[reportMissingImports]
        except ImportError as exc:  # pragma: no cover
            raise LLMError(
                "google-generativeai paketi yuklenmemis. "
                "`pip install google-generativeai` ile kurun."
            ) from exc
        genai.configure(api_key=api_key)
        self._genai = genai

    @staticmethod
    def _to_gemini_messages(messages: List[ChatMessage]) -> tuple[Optional[str], List[Dict[str, Any]]]:
        """ChatMessage listesini Gemini'in bekledigi formata cevir.

        Gemini system_instruction'i ayri parametre olarak alir.
        """
        system_instruction: Optional[str] = None
        history: List[Dict[str, Any]] = []
        for m in messages:
            if m.role == "system":
                # Birden fazla system varsa birlestir
                if system_instruction:
                    system_instruction = system_instruction + "\n\n" + m.content
                else:
                    system_instruction = m.content
            elif m.role == "user":
                history.append({"role": "user", "parts": [{"text": m.content}]})
            elif m.role == "assistant":
                # Tool cagrisi varsa function_call parts ekle
                parts: List[Dict[str, Any]] = []
                if m.content:
                    parts.append({"text": m.content})
                for tc in m.tool_calls or []:
                    parts.append({
                        "function_call": {
                            "name": tc.name,
                            "args": tc.arguments}})
                if not parts:
                    parts = [{"text": ""}]
                history.append({"role": "model", "parts": parts})
            elif m.role == "tool":
                # Tool sonucu - function_response
                history.append({
                    "role": "function",
                    "parts": [{
                        "function_response": {
                            "name": m.tool_name or "tool",
                            "response": {"content": m.content}}}]})
        return system_instruction, history

    @staticmethod
    def _sanitize_schema(schema: Any) -> Any:
        """Gemini parameters schemasinda 'default' veya 'additionalProperties' anahtari olmasini sevmez, recursive olarak temizle."""
        if isinstance(schema, dict):
            new_dict = {}
            for k, v in schema.items():
                if k in ("default", "additionalProperties"):
                    continue
                new_dict[k] = GeminiProvider._sanitize_schema(v)
            return new_dict
        elif isinstance(schema, list):
            return [GeminiProvider._sanitize_schema(x) for x in schema]
        return schema

    @staticmethod
    def _convert_openai_tools_to_gemini(tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """OpenAI tools schema'sini Gemini Tool formatina cevir ve 'default' alanlarini temizle."""
        gemini_funcs = []
        for t in tools:
            if t.get("type") == "function" and "function" in t:
                fn = t["function"]
                raw_params = fn.get("parameters", {"type": "object", "properties": {}})
                sanitized_params = GeminiProvider._sanitize_schema(raw_params)
                gemini_funcs.append({
                    "name": fn.get("name"),
                    "description": fn.get("description", ""),
                    "parameters": sanitized_params})
            elif "name" in t:  # zaten anthropic-benzeri format
                raw_params = t.get("input_schema", t.get("parameters", {}))
                sanitized_params = GeminiProvider._sanitize_schema(raw_params)
                gemini_funcs.append({
                    "name": t.get("name"),
                    "description": t.get("description", ""),
                    "parameters": sanitized_params})
        if not gemini_funcs:
            return []
        return [{"function_declarations": gemini_funcs}]

    async def chat(
        self,
        messages: List[ChatMessage],
        *,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        tools: Optional[List[Dict[str, Any]]] = None,
        **kwargs,
    ) -> LLMResponse:
        system_instruction, history = self._to_gemini_messages(messages)

        gemini_tools = None
        if tools:
            gemini_tools = self._convert_openai_tools_to_gemini(tools)

        loop = asyncio.get_event_loop()

        def _run_blocking():
            model_kwargs: Dict[str, Any] = {
                "model_name": self.model,
                "generation_config": {
                    "temperature": temperature,
                    "max_output_tokens": max_tokens}}
            if system_instruction:
                model_kwargs["system_instruction"] = system_instruction
            if gemini_tools:
                model_kwargs["tools"] = gemini_tools

            model = self._genai.GenerativeModel(**model_kwargs)
            response = model.generate_content(history)
            return response

        try:
            response = await loop.run_in_executor(None, _run_blocking)
        except Exception as exc:  # pragma: no cover
            raise LLMError(f"Gemini cagrisi basarisiz: {exc}") from exc

        # Yaniti parse et
        content_text = ""
        tool_calls: List[ToolCall] = []
        try:
            candidate = response.candidates[0] if response.candidates else None
            if candidate and candidate.content and candidate.content.parts:
                for i, part in enumerate(candidate.content.parts):
                    # function_call?
                    fc = getattr(part, "function_call", None)
                    if fc and getattr(fc, "name", None):
                        args = {}
                        try:
                            # MapComposite -> dict
                            if hasattr(fc, "args"):
                                args = dict(fc.args) if fc.args else {}
                        except Exception:
                            args = {}
                        tool_calls.append(ToolCall(
                            id=f"call_{self.model}_{i}",
                            name=fc.name,
                            arguments=args,
                        ))
                    elif getattr(part, "text", None):
                        content_text += part.text
        except Exception as exc:  # pragma: no cover
            logger.warning("Gemini response parse hata: %s", exc)
            content_text = getattr(response, "text", "") or ""

        # Token usage
        usage = getattr(response, "usage_metadata", None)
        prompt_t = getattr(usage, "prompt_token_count", None) if usage else None
        comp_t = getattr(usage, "candidates_token_count", None) if usage else None
        total_t = getattr(usage, "total_token_count", None) if usage else None

        # finish_reason
        stop_reason = None
        try:
            if response.candidates:
                fr = response.candidates[0].finish_reason
                stop_reason = str(fr) if fr is not None else None
        except Exception:
            pass

        return LLMResponse(
            content=content_text,
            provider=self.name,
            model=self.model,
            prompt_tokens=prompt_t,
            completion_tokens=comp_t,
            total_tokens=total_t,
            raw={},
            tool_calls=tool_calls,
            stop_reason=stop_reason,
        )

    async def close(self) -> None:
        return None