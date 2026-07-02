"""Process yonetimi tool'lari (psutil)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ListProcessesTool(BaseTool):
    name = "list_processes"
    description = (
        "Calisan sureclerin listesini doner (PID, isim, CPU%, RAM MB). "
        "Filter parametresi ile ad iceren surecleri filtrele."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "filter": {
                "type": "string",
                "description": "(opsiyonel) Surec adinda gecen substring."},
            "limit": {"type": "integer", "default": 30}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import psutil  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="psutil yuklu degil")

        flt = (args.get("filter") or "").lower().strip()
        limit = int(args.get("limit") or 30)
        out: List[Dict[str, Any]] = []
        try:
            for p in psutil.process_iter(["pid", "name", "cpu_percent", "memory_info"]):
                try:
                    info = p.info
                    name = info.get("name") or ""
                    if flt and flt not in name.lower():
                        continue
                    mem = info.get("memory_info")
                    out.append({
                        "pid": info["pid"],
                        "name": name,
                        "cpu": info.get("cpu_percent") or 0.0,
                        "ram_mb": round((mem.rss if mem else 0) / (1024 * 1024), 1)})
                except Exception:
                    continue
            out.sort(key=lambda x: x["ram_mb"], reverse=True)
            shown = out[:limit]
            lines = [f"{len(out)} surec ({len(shown)} gosteriliyor):"]
            for p in shown:
                lines.append(f"  {p['pid']:>6}  {p['name']:<30}  CPU:{p['cpu']:>5.1f}%  RAM:{p['ram_mb']:>7.1f}MB")
            return ToolResult(ok=True, output="\n".join(lines), data={"processes": shown})
        except Exception as exc:
            return ToolResult(ok=False, error=f"Surecler listelenemedi: {exc}")


class KillProcessTool(BaseTool):
    name = "kill_process"
    description = "PID veya isim ile bir sureci sonlandirir. Dikkatli kullan."
    permission = "system_admin"
    requires_confirmation = False
    parameters = {
        "type": "object",
        "properties": {
            "pid": {"type": "integer", "description": "Surec PID'si (yoksa name)."},
            "name": {"type": "string", "description": "Surec adi (yoksa pid). Tum eslesenler kapatilir."}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import psutil  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="psutil yuklu degil")

        pid = args.get("pid")
        name = (args.get("name") or "").strip().lower()
        if not pid and not name:
            return ToolResult(ok=False, error="pid veya name gerekli")

        killed: List[int] = []
        errors: List[str] = []
        try:
            if pid:
                try:
                    p = psutil.Process(int(pid))
                    p.terminate()
                    killed.append(int(pid))
                except Exception as exc:
                    errors.append(f"PID {pid}: {exc}")
            else:
                for p in psutil.process_iter(["pid", "name"]):
                    try:
                        pname = (p.info.get("name") or "").lower()
                        if name in pname:
                            p.terminate()
                            killed.append(p.info["pid"])
                    except Exception as exc:
                        errors.append(str(exc))
            ok = bool(killed)
            return ToolResult(
                ok=ok,
                output=f"Sonlandirilan: {killed}" + (f" Hatalar: {errors}" if errors else ""),
                error="; ".join(errors) if not ok and errors else None,
                data={"killed": killed, "errors": errors},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Surec sonlandirilamadi: {exc}")