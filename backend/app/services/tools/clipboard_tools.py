"""Pano (clipboard) tool'lari."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _try_pyperclip():
    try:
        import pyperclip  # type: ignore
        return pyperclip
    except Exception:
        return None


class ClipboardGetTool(BaseTool):
    name = "clipboard_get"
    description = "Sistem panosundaki (clipboard) mevcut metni okur."
    permission = "system_admin"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pc = _try_pyperclip()
        if not pc:
            return ToolResult(ok=False, error="pyperclip yuklu degil")
        try:
            text = await asyncio.get_event_loop().run_in_executor(None, pc.paste)
            return ToolResult(
                ok=True,
                output=f"Pano icerigi ({len(text)} char):\n{text[:2000]}",
                data={"text": text, "length": len(text)},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Pano okunamadi: {exc}")


class ClipboardSetTool(BaseTool):
    name = "clipboard_set"
    description = "Sistem panosuna metin yazar (kopyalar)."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Panoya yazilacak metin."}
        },
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pc = _try_pyperclip()
        if not pc:
            return ToolResult(ok=False, error="pyperclip yuklu degil")
        text = args.get("text") or ""
        try:
            await asyncio.get_event_loop().run_in_executor(None, pc.copy, str(text))
            return ToolResult(
                ok=True,
                output=f"Panoya {len(str(text))} karakter yazildi.",
                data={"length": len(str(text))},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Panoya yazilamadi: {exc}")