"""Pencere yonetimi tool'lari (Windows odakli, pygetwindow)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _try_pygetwindow():
    try:
        import pygetwindow as gw  # type: ignore
        return gw
    except Exception:
        return None


def _list_windows_sync() -> List[Dict[str, Any]]:
    gw = _try_pygetwindow()
    if not gw:
        return []
    out = []
    for w in gw.getAllWindows():
        try:
            if not w.title:
                continue
            out.append({
                "title": w.title,
                "x": w.left,
                "y": w.top,
                "width": w.width,
                "height": w.height,
                "is_active": w.isActive,
                "is_minimized": w.isMinimized,
                "is_maximized": w.isMaximized})
        except Exception:
            continue
    return out


class ListWindowsTool(BaseTool):
    name = "list_windows"
    description = "Acik pencerelerin baslik ve konumlarini listeler."
    permission = "system_admin"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        gw = _try_pygetwindow()
        if not gw:
            return ToolResult(ok=False, error="pygetwindow yuklu degil")
        try:
            wins = await asyncio.get_event_loop().run_in_executor(None, _list_windows_sync)
            lines = [f"{len(wins)} acik pencere:"]
            for i, w in enumerate(wins[:50], 1):
                tags = []
                if w["is_active"]:
                    tags.append("aktif")
                if w["is_minimized"]:
                    tags.append("min")
                if w["is_maximized"]:
                    tags.append("max")
                tag_str = f" [{','.join(tags)}]" if tags else ""
                lines.append(f"  {i}. {w['title']}{tag_str} ({w['width']}x{w['height']})")
            return ToolResult(ok=True, output="\n".join(lines), data={"windows": wins})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Pencereler listelenemedi: {exc}")


def _find_window(title_substr: str):
    gw = _try_pygetwindow()
    if not gw:
        return None
    for w in gw.getAllWindows():
        if w.title and title_substr.lower() in w.title.lower():
            return w
    return None


class FocusWindowTool(BaseTool):
    name = "focus_window"
    description = "Basligi (kismi eslesme) belirtilen pencereyi one cikarir / odaklanir."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {"title": {"type": "string"}},
        "required": ["title"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        title = (args.get("title") or "").strip()
        if not title:
            return ToolResult(ok=False, error="title bos olamaz")
        try:
            w = await asyncio.get_event_loop().run_in_executor(None, _find_window, title)
            if not w:
                return ToolResult(ok=False, error=f"Pencere bulunamadi: {title}")
            await asyncio.get_event_loop().run_in_executor(None, w.activate)
            return ToolResult(ok=True, output=f"Pencere odaklandi: {w.title}", data={"title": w.title})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Odakla basarisiz: {exc}")


class MinimizeWindowTool(BaseTool):
    name = "minimize_window"
    description = "Basligi belirtilen pencereyi simge durumuna kuculutur."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {"title": {"type": "string"}},
        "required": ["title"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        title = (args.get("title") or "").strip()
        try:
            w = await asyncio.get_event_loop().run_in_executor(None, _find_window, title)
            if not w:
                return ToolResult(ok=False, error=f"Pencere bulunamadi: {title}")
            await asyncio.get_event_loop().run_in_executor(None, w.minimize)
            return ToolResult(ok=True, output=f"Pencere kuculutuldu: {w.title}")
        except Exception as exc:
            return ToolResult(ok=False, error=str(exc))


class MaximizeWindowTool(BaseTool):
    name = "maximize_window"
    description = "Basligi belirtilen pencereyi tam ekran yapar."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {"title": {"type": "string"}},
        "required": ["title"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        title = (args.get("title") or "").strip()
        try:
            w = await asyncio.get_event_loop().run_in_executor(None, _find_window, title)
            if not w:
                return ToolResult(ok=False, error=f"Pencere bulunamadi: {title}")
            await asyncio.get_event_loop().run_in_executor(None, w.maximize)
            return ToolResult(ok=True, output=f"Pencere tam ekran yapildi: {w.title}")
        except Exception as exc:
            return ToolResult(ok=False, error=str(exc))


class CloseWindowTool(BaseTool):
    name = "close_window"
    description = "Basligi belirtilen pencereyi kapatir."
    permission = "system_admin"
    requires_confirmation = False
    parameters = {
        "type": "object",
        "properties": {"title": {"type": "string"}},
        "required": ["title"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        title = (args.get("title") or "").strip()
        try:
            w = await asyncio.get_event_loop().run_in_executor(None, _find_window, title)
            if not w:
                return ToolResult(ok=False, error=f"Pencere bulunamadi: {title}")
            wtitle = w.title
            await asyncio.get_event_loop().run_in_executor(None, w.close)
            return ToolResult(ok=True, output=f"Pencere kapatildi: {wtitle}")
        except Exception as exc:
            return ToolResult(ok=False, error=str(exc))