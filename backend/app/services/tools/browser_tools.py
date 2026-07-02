"""Browser ve web ile ilgili tool'lar: open_url, web_search."""
from __future__ import annotations

import asyncio
import logging
import platform
import webbrowser
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class OpenUrlTool(BaseTool):
    """Verilen URL'yi varsayilan tarayicida acar VE pencereyi one cikarir."""

    name = "open_url"
    description = (
        "Bir web sitesini kullanicinin varsayilan tarayicisinda acar ve "
        "tarayici penceresini one (foreground) getirir. Kullanici 'X sitesini ac', "
        "'google'a gir', 'youtube'u ac' dediginde kullan. URL https:// veya "
        "http:// ile baslamali; eksikse https:// ekle."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "url": {
                "type": "string",
                "description": "Acilacak tam URL. orn. https://www.google.com"},
            "no_focus": {
                "type": "boolean",
                "description": "True ise tarayiciyi one cikarmaz.",
                "default": False}},
        "required": ["url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        url = (args.get("url") or "").strip()
        no_focus = bool(args.get("no_focus", False))
        if not url:
            return ToolResult(ok=False, error="URL bos olamaz")

        # https:// ekle
        if not url.startswith(("http://", "https://", "file://")):
            url = "https://" + url

        loop = asyncio.get_event_loop()
        try:
            opened = await loop.run_in_executor(None, webbrowser.open, url)
        except Exception as exc:
            logger.exception("open_url hatasi")
            return ToolResult(ok=False, error=f"Tarayici acilirken hata: {exc}")

        if not opened:
            return ToolResult(ok=False, error=f"Tarayici acilamadi: {url}")

        # Pencereyi one cikar
        focused = False
        if not no_focus and platform.system().lower() == "windows":
            from app.services.tools.system_tools import _focus_by_title_win
            # Bir an bekle, tarayici penceresinin acilmasi icin
            await asyncio.sleep(0.6)
            # Domain'i title'da arayalim (Chrome/Edge tab title genelde site adi)
            try:
                from urllib.parse import urlparse
                host = urlparse(url).hostname or ""
                hint = host.split(".")[-2] if "." in host else host  # "google.com" -> "google"
                if hint:
                    focused = await loop.run_in_executor(
                        None, _focus_by_title_win, hint, 3.5
                    )
                # Fallback: yaygın tarayıcı isimleri
                if not focused:
                    for candidate in ("Chrome", "Edge", "Firefox", "Brave", "Opera"):
                        focused = await loop.run_in_executor(
                            None, _focus_by_title_win, candidate, 1.5
                        )
                        if focused:
                            break
            except Exception:
                pass

        msg = f"'{url}' adresi varsayilan tarayicida acildi"
        if focused:
            msg += " ve pencere one cikarildi"
        return ToolResult(
            ok=True,
            output=msg + ".",
            data={"url": url, "focused": focused},
        )


class WebSearchTool(BaseTool):
    """DuckDuckGo ile internet aramasi yapar."""

    name = "web_search"
    description = (
        "Internet uzerinde arama yapar ve ilk birkac sonucun basligini, URL'sini ve ozetini doner. "
        "Guncel bilgi, haber, fiyat, tanim aramak icin kullan. "
        "Kullanici bir konu hakkinda bilgi sordugunda ve senin egitim verisinden emin degilsen kullan."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Aranacak sorgu. Turkce veya Ingilizce olabilir."},
            "max_results": {
                "type": "integer",
                "description": "Donmesi istenen maksimum sonuc sayisi (varsayilan 5).",
                "default": 5}},
        "required": ["query"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        query = (args.get("query") or "").strip()
        if not query:
            return ToolResult(ok=False, error="Arama sorgusu bos olamaz")

        max_results = int(args.get("max_results") or 5)
        max_results = max(1, min(max_results, 10))

        try:
            results = await asyncio.get_event_loop().run_in_executor(
                None, self._search_sync, query, max_results
            )
        except Exception as exc:
            logger.exception("web_search hatasi")
            return ToolResult(ok=False, error=f"Arama basarisiz: {exc}")

        if not results:
            return ToolResult(
                ok=True,
                output=f"'{query}' icin sonuc bulunamadi.",
                data={"query": query, "results": []},
            )

        lines: List[str] = [f"'{query}' icin {len(results)} sonuc:"]
        for i, r in enumerate(results, 1):
            title = r.get("title") or "(baslik yok)"
            url = r.get("href") or r.get("url") or ""
            body = (r.get("body") or "").strip()
            lines.append(f"\n{i}. {title}\n   URL: {url}\n   {body[:300]}")

        return ToolResult(
            ok=True,
            output="\n".join(lines),
            data={"query": query, "results": results},
        )

    @staticmethod
    def _search_sync(query: str, max_results: int) -> List[Dict[str, Any]]:
        try:
            from duckduckgo_search import DDGS  # type: ignore
        except ImportError:
            raise RuntimeError(
                "duckduckgo-search paketi yuklu degil. `pip install duckduckgo-search` ile kurun."
            )
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=max_results))