"""Network tool'lari: http_request, download_file, ping_host."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class HttpRequestTool(BaseTool):
    name = "http_request"
    description = (
        "Bir HTTP istegi yapar (GET/POST/PUT/DELETE) ve cevabin status, headers ve body'sini doner. "
        "REST API'leri test etmek, web sayfasi cekmek, webhook tetiklemek icin kullan."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Istek URL'si."},
            "method": {
                "type": "string",
                "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
                "default": "GET"},
            "headers": {
                "type": "object",
                "description": "(opsiyonel) Istek basliklari sozlugu.",
                "additionalProperties": {"type": "string"}},
            "body": {
                "type": "string",
                "description": "(opsiyonel) Istek govdesi (JSON string vb.)."},
            "timeout_sec": {"type": "integer", "default": 20}},
        "required": ["url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        url = (args.get("url") or "").strip()
        if not url:
            return ToolResult(ok=False, error="URL bos olamaz")
        method = (args.get("method") or "GET").upper()
        headers = args.get("headers") or {}
        body = args.get("body")
        timeout = float(args.get("timeout_sec") or 20)

        try:
            async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
                resp = await client.request(
                    method,
                    url,
                    headers=headers if isinstance(headers, dict) else None,
                    content=body if body is not None else None,
                )
            text = resp.text
            if len(text) > 4000:
                text = text[:4000] + f"\n... ({len(resp.text) - 4000} char kesildi)"
            output = (
                f"{method} {url}\nStatus: {resp.status_code}\n"
                f"Headers: {dict(resp.headers)}\n\nBody:\n{text}"
            )
            return ToolResult(
                ok=resp.is_success,
                output=output,
                data={
                    "url": url,
                    "method": method,
                    "status": resp.status_code,
                    "headers": dict(resp.headers)},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"HTTP istek basarisiz: {exc}")


class DownloadFileTool(BaseTool):
    name = "download_file"
    description = "Bir URL'den dosya indirir ve diske kaydeder."
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string"},
            "save_path": {"type": "string", "description": "Kaydedilecek tam dosya yolu."}},
        "required": ["url", "save_path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        url = (args.get("url") or "").strip()
        save_path = (args.get("save_path") or "").strip()
        if not url or not save_path:
            return ToolResult(ok=False, error="url ve save_path zorunlu")

        try:
            path = Path(save_path).expanduser().resolve()
            path.parent.mkdir(parents=True, exist_ok=True)
            async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
                async with client.stream("GET", url) as resp:
                    resp.raise_for_status()
                    total = 0
                    with path.open("wb") as f:
                        async for chunk in resp.aiter_bytes():
                            f.write(chunk)
                            total += len(chunk)
            return ToolResult(
                ok=True,
                output=f"'{url}' indirildi -> '{path}' ({total} bayt).",
                data={"path": str(path), "bytes": total},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Indirme basarisiz: {exc}")


class PingHostTool(BaseTool):
    name = "ping_host"
    description = "Bir host'a ping atip yanit verip vermedigini kontrol eder."
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "host": {"type": "string", "description": "Hostname veya IP."},
            "count": {"type": "integer", "default": 4}},
        "required": ["host"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        import platform
        host = (args.get("host") or "").strip()
        count = int(args.get("count") or 4)
        if not host:
            return ToolResult(ok=False, error="host bos olamaz")
        param = "-n" if platform.system().lower() == "windows" else "-c"
        cmd = f"ping {param} {count} {host}"
        try:
            proc = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=30)
            text = stdout.decode("utf-8", errors="replace")
            return ToolResult(
                ok=(proc.returncode == 0),
                output=text,
                data={"host": host, "exit_code": proc.returncode},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Ping basarisiz: {exc}")