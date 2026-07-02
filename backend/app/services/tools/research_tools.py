"""Sprint D.2: Akademik ve arastirma tool'lari.

- arxiv_search   : arxiv.org icin XML API (httpx)
- wikipedia_lookup: Wikipedia REST API (sayfa ozet)
- youtube_search  : DuckDuckGo HTML scrape ile (API key gerekmez)
- youtube_transcript: youtube_transcript_api (opsiyonel paket)
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List
from urllib.parse import quote_plus

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


# ============================================================
# arxiv_search
# ============================================================


class ArxivSearchTool(BaseTool):
    name = "arxiv_search"
    description = (
        "arxiv.org makale arsivinde arama yapar. Akademik makale ozeti, baslik, "
        "yazar listesi ve PDF bagi doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Arama sorgusu (ornek: 'transformer attention')"},
            "max_results": {"type": "integer", "default": 5, "minimum": 1, "maximum": 20}},
        "required": ["query"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        query = (args.get("query") or "").strip()
        if not query:
            return ToolResult(ok=False, error="query bos olamaz")
        max_results = int(args.get("max_results") or 5)
        max_results = max(1, min(20, max_results))

        url = (
            f"http://export.arxiv.org/api/query?search_query=all:{quote_plus(query)}"
            f"&max_results={max_results}"
        )
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                xml = resp.text
        except Exception as exc:
            return ToolResult(ok=False, error=f"arxiv istegi hata: {exc}")

        # Basit XML parse (entry blocklarini regex ile ayikla)
        entries = re.findall(r"<entry>(.*?)</entry>", xml, flags=re.DOTALL)
        if not entries:
            return ToolResult(ok=True, output="(sonuc yok)", data={"results": []})

        def _extract(pattern: str, text: str) -> str:
            m = re.search(pattern, text, flags=re.DOTALL)
            return m.group(1).strip() if m else ""

        results: List[Dict[str, str]] = []
        for entry in entries:
            title = _extract(r"<title>(.*?)</title>", entry)
            summary = _extract(r"<summary>(.*?)</summary>", entry)
            entry_url = _extract(r"<id>(.*?)</id>", entry)
            authors = re.findall(r"<name>(.*?)</name>", entry)
            published = _extract(r"<published>(.*?)</published>", entry)
            results.append({
                "title": " ".join(title.split()),
                "summary": " ".join(summary.split())[:600],
                "url": entry_url,
                "authors": ", ".join(authors[:5]),
                "published": published[:10]})

        # Output icin kisa string
        lines = []
        for i, r in enumerate(results, 1):
            lines.append(f"{i}. {r['title']} ({r['published']})")
            lines.append(f"   {r['authors']}")
            lines.append(f"   {r['url']}")
            lines.append(f"   {r['summary'][:200]}...")
        return ToolResult(
            ok=True,
            output="\n".join(lines),
            data={"results": results, "count": len(results), "query": query},
        )


# ============================================================
# wikipedia_lookup
# ============================================================


class WikipediaLookupTool(BaseTool):
    name = "wikipedia_lookup"
    description = (
        "Wikipedia'da bir konu/baslik aramasi yapar; sayfa ozetini, kategorileri ve URL'i doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "description": "Aranan baslik (Turkce veya Ingilizce)"},
            "language": {"type": "string", "default": "tr", "description": "Dil kodu (tr, en, de, ...)"}},
        "required": ["title"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        title = (args.get("title") or "").strip()
        if not title:
            return ToolResult(ok=False, error="title bos olamaz")
        lang = (args.get("language") or "tr").strip()

        url = f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{quote_plus(title)}"
        try:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                resp = await client.get(url, headers={"Accept": "application/json"})
                if resp.status_code == 404:
                    return ToolResult(
                        ok=False,
                        error=f"'{title}' icin Wikipedia sayfasi bulunamadi (lang={lang})",
                    )
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:
            return ToolResult(ok=False, error=f"wikipedia istegi hata: {exc}")

        page_title = data.get("title", title)
        extract = data.get("extract", "")
        page_url = data.get("content_urls", {}).get("desktop", {}).get("page", "")
        thumbnail = data.get("thumbnail", {}).get("source")

        output = f"# {page_title}\n\n{extract}\n\nURL: {page_url}"
        return ToolResult(
            ok=True,
            output=output,
            data={
                "title": page_title,
                "extract": extract,
                "url": page_url,
                "thumbnail": thumbnail,
                "lang": lang},
        )


# ============================================================
# youtube_search (DuckDuckGo scrape — API key gerekmez)
# ============================================================


class YoutubeSearchTool(BaseTool):
    name = "youtube_search"
    description = (
        "YouTube'da video arar (DuckDuckGo HTML scrape). En fazla 10 sonuc doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "query": {"type": "string"},
            "max_results": {"type": "integer", "default": 5, "minimum": 1, "maximum": 10}},
        "required": ["query"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import httpx  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="httpx paketi yuklu degil")

        query = (args.get("query") or "").strip()
        if not query:
            return ToolResult(ok=False, error="query bos olamaz")
        max_results = int(args.get("max_results") or 5)
        max_results = max(1, min(10, max_results))

        # DuckDuckGo HTML — site:youtube.com filtre
        ddg_url = f"https://html.duckduckgo.com/html/?q={quote_plus('site:youtube.com ' + query)}"
        try:
            async with httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (compatible; UmtalAgent/1.0)"},
            ) as client:
                resp = await client.get(ddg_url)
                resp.raise_for_status()
                html = resp.text
        except Exception as exc:
            return ToolResult(ok=False, error=f"youtube arama hata: {exc}")

        # YouTube linklerini ayikla
        video_urls = re.findall(
            r"https?://(?:www\.)?youtube\.com/watch\?v=[\w-]+",
            html,
        )
        # Tekrarsiz, sirali
        seen = set()
        unique_urls = []
        for u in video_urls:
            if u not in seen:
                seen.add(u)
                unique_urls.append(u)
            if len(unique_urls) >= max_results:
                break

        if not unique_urls:
            return ToolResult(ok=True, output="(sonuc yok)", data={"results": []})

        # Her URL icin baslik bilgisini cekme tarafini atliyoruz (hizli kalsin).
        results = [{"url": u, "video_id": u.split("v=")[1][:11]} for u in unique_urls]
        output = "\n".join(f"{i+1}. {r['url']}" for i, r in enumerate(results))
        return ToolResult(
            ok=True,
            output=output,
            data={"results": results, "count": len(results), "query": query},
        )


# ============================================================
# youtube_transcript
# ============================================================


class YoutubeTranscriptTool(BaseTool):
    name = "youtube_transcript"
    description = (
        "YouTube videosunun otomatik transkriptini cekip metin halinde doner. "
        "youtube-transcript-api paketi kuruluysa calisir."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "video_id_or_url": {
                "type": "string",
                "description": "YouTube video ID'si (11 char) veya tam URL"},
            "languages": {
                "type": "array",
                "items": {"type": "string"},
                "default": ["tr", "en"]}},
        "required": ["video_id_or_url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            from youtube_transcript_api import YouTubeTranscriptApi  # type: ignore
        except ImportError:
            return ToolResult(
                ok=False,
                error="youtube-transcript-api paketi yuklu degil. pip install youtube-transcript-api",
            )

        raw = (args.get("video_id_or_url") or "").strip()
        if not raw:
            return ToolResult(ok=False, error="video_id_or_url bos olamaz")

        # ID ayikla
        video_id = raw
        m = re.search(r"v=([\w-]{11})", raw)
        if m:
            video_id = m.group(1)
        elif "youtu.be/" in raw:
            video_id = raw.split("youtu.be/")[-1].split("?")[0][:11]

        languages = args.get("languages") or ["tr", "en"]
        if not isinstance(languages, list):
            languages = ["tr", "en"]

        try:
            # youtube-transcript-api senkron; thread'e kaydir
            import asyncio as _asyncio
            transcript = await _asyncio.get_event_loop().run_in_executor(
                None,
                lambda: YouTubeTranscriptApi.get_transcript(video_id, languages=languages),
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"transcript alinamadi: {exc}")

        full_text = " ".join(seg.get("text", "").strip() for seg in transcript)
        return ToolResult(
            ok=True,
            output=full_text[:4000] + ("..." if len(full_text) > 4000 else ""),
            data={
                "video_id": video_id,
                "segments": len(transcript),
                "characters": len(full_text),
                "full_text": full_text,
                "languages_tried": languages},
        )