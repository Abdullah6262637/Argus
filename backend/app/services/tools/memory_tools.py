"""Memory (kalici hafiza) tool'lari - basit JSON dosya tabanli."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from typing import Any, Dict, List

from app.config import get_settings
from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _memory_path(agent_id: str) -> Path:
    settings = get_settings()
    p = settings.data_dir / "agent_memory" / f"{agent_id}.json"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def _load(agent_id: str) -> Dict[str, str]:
    p = _memory_path(agent_id)
    if not p.exists():
        return {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _save(agent_id: str, data: Dict[str, str]) -> None:
    p = _memory_path(agent_id)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


class SaveMemoryTool(BaseTool):
    name = "save_memory"
    description = (
        "Kalici hafizaya bir bilgi yazar (anahtar -> deger). Sohbet kapansa bile "
        "ileride 'recall_memory' ile geri okunabilir. Kullanici tercihleri, "
        "isim, projeler vb. icin kullan."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Hatirlanacak anahtar."},
            "value": {"type": "string", "description": "Saklanacak metin."}},
        "required": ["key", "value"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        key = (args.get("key") or "").strip()
        value = args.get("value")
        if not key:
            return ToolResult(ok=False, error="key bos olamaz")
        if value is None:
            return ToolResult(ok=False, error="value gerekli")
        try:
            data = _load(context.agent_id)
            data[key] = str(value)
            _save(context.agent_id, data)
            return ToolResult(
                ok=True,
                output=f"Hafizaya yazildi: {key} = {str(value)[:100]}",
                data={"key": key, "stored": True},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Hafiza yazilamadi: {exc}")


class RecallMemoryTool(BaseTool):
    name = "recall_memory"
    description = "Kalici hafizadan bir anahtarin degerini okur."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {"key": {"type": "string"}},
        "required": ["key"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        key = (args.get("key") or "").strip()
        if not key:
            return ToolResult(ok=False, error="key bos olamaz")
        data = _load(context.agent_id)
        if key not in data:
            return ToolResult(ok=True, output=f"'{key}' icin kayit yok.", data={"found": False})
        return ToolResult(
            ok=True,
            output=f"{key}: {data[key]}",
            data={"key": key, "value": data[key], "found": True},
        )


class ListMemoryTool(BaseTool):
    name = "list_memory"
    description = "Kalici hafizadaki tum anahtar -> deger ciftlerini listeler."
    permission = "none"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        data = _load(context.agent_id)
        if not data:
            return ToolResult(ok=True, output="(hafiza bos)", data={"count": 0})
        lines = [f"Hafizada {len(data)} kayit:"]
        for k, v in data.items():
            v_short = str(v)[:80] + ("..." if len(str(v)) > 80 else "")
            lines.append(f"  {k}: {v_short}")
        return ToolResult(ok=True, output="\n".join(lines), data={"keys": list(data.keys())})


class DeleteMemoryTool(BaseTool):
    name = "delete_memory"
    description = "Kalici hafizadan bir anahtari siler."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {"key": {"type": "string"}},
        "required": ["key"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        key = (args.get("key") or "").strip()
        data = _load(context.agent_id)
        if key in data:
            del data[key]
            _save(context.agent_id, data)
            return ToolResult(ok=True, output=f"Silindi: {key}")
        return ToolResult(ok=True, output=f"'{key}' zaten yoktu.")