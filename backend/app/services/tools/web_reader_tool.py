"""WebPageReaderTool: Jina Reader API sarmalayicisi."""
from __future__ import annotations

import logging
from typing import Any, Dict

import httpx

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class ReadWebpageMarkdownTool(BaseTool):
    """Herhangi bir URL'deki sayfayi temiz Markdown olarak okur."""

    name = "read_webpage_markdown"
    description = (
        "Herhangi bir web sayfasının içeriğini temiz ve okunabilir Markdown formatında çeker. "
        "Teknik belgeleri okumak, kütüphane dokümantasyonlarını incelemek veya "
        "blog yazıları / makaleleri okumak için bu aracı kullan."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Okunacak web sayfasının tam URL'si (http:// veya https:// ile başlayan)"
            }
        },
        "required": ["url"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        url = (args.get("url") or "").strip()
        if not url:
            return ToolResult(ok=False, error="URL bos olamaz")
        
        if not url.startswith(("http://", "https://")):
            url = "https://" + url

        try:
            reader_url = f"https://r.jina.ai/{url}"
            headers = {"User-Agent": "Mozilla/5.0 (UmtalAgent)"}
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(reader_url, headers=headers)
                if resp.status_code == 200:
                    content = resp.text
                    if len(content) > 35000:
                        content = content[:35000] + "\n\n... (Cikti çok uzun oldugu icin kırpıldı) ..."
                    return ToolResult(
                        ok=True,
                        output=content,
                        data={"url": url, "raw_len": len(resp.text)}
                    )
                else:
                    return ToolResult(ok=False, error=f"Sayfa okunamadı. HTTP {resp.status_code}")
        except Exception as exc:
            logger.exception("read_webpage_markdown hatasi")
            return ToolResult(ok=False, error=f"Sayfa okunurken hata olustu: {exc}")
