"""Playwright tabanli browser otomasyon tool'lari (FAZ 2.2)."""
from __future__ import annotations

import base64
import logging
from pathlib import Path
from typing import Any, Dict

from app.services.browser import browser_engine
from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _check_available() -> ToolResult | None:
    if not browser_engine.available:
        return ToolResult(
            ok=False,
            error=(
                "Playwright kurulu degil. Yuklemek icin terminal'de: "
                "pip install playwright && playwright install chromium"
            ),
        )
    return None


class BrowserNavigateTool(BaseTool):
    name = "browser_navigate"
    description = (
        "Tarayicida bir URL'ye gider. Playwright ile yonetilen browser'i kullanir. "
        "Sayfa basligi ve URL doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Gidilecek URL (https://...)"},
            "wait_until": {
                "type": "string",
                "enum": ["load", "domcontentloaded", "networkidle"],
                "default": "domcontentloaded"}},
        "required": ["url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        url = (args.get("url") or "").strip()
        if not url:
            return ToolResult(ok=False, error="url gerekli")
        wait_until = args.get("wait_until", "domcontentloaded")
        try:
            page = await browser_engine.get_page(context.agent_id)
            await page.goto(url, wait_until=wait_until)
            title = await page.title()
            current_url = page.url
            return ToolResult(
                ok=True,
                output=f"Acildi: {title} ({current_url})",
                data={"title": title, "url": current_url},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Navigate hata: {exc}")


class BrowserGetTextTool(BaseTool):
    name = "browser_get_text"
    description = (
        "Aktif sayfadan metni cikarir. selector verilirse sadece o oge, yoksa "
        "tum body metni doner. Maksimum 8000 karakter."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "selector": {"type": "string", "description": "CSS selector (opsiyonel)"},
            "max_chars": {"type": "integer", "default": 8000}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        selector = (args.get("selector") or "").strip()
        max_chars = int(args.get("max_chars", 8000))
        try:
            page = await browser_engine.get_page(context.agent_id)
            if selector:
                text = await page.locator(selector).first.inner_text()
            else:
                text = await page.evaluate("() => document.body.innerText")
            if len(text) > max_chars:
                text = text[:max_chars] + f"\n...[{len(text) - max_chars} karakter kesildi]"
            return ToolResult(ok=True, output=text, data={"length": len(text)})
        except Exception as exc:
            return ToolResult(ok=False, error=f"GetText hata: {exc}")


class BrowserClickTool(BaseTool):
    name = "browser_click"
    description = "Sayfada bir CSS selector'e tikla."
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "selector": {"type": "string", "description": "Tiklanacak ogenin CSS selector'u"},
            "timeout_ms": {"type": "integer", "default": 5000}},
        "required": ["selector"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        selector = (args.get("selector") or "").strip()
        if not selector:
            return ToolResult(ok=False, error="selector gerekli")
        timeout_ms = int(args.get("timeout_ms", 5000))
        try:
            page = await browser_engine.get_page(context.agent_id)
            await page.locator(selector).first.click(timeout=timeout_ms)
            return ToolResult(ok=True, output=f"Tiklandi: {selector}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Click hata: {exc}")


class BrowserFillTool(BaseTool):
    name = "browser_fill"
    description = "Bir input/textarea'ya metin yaz."
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "selector": {"type": "string"},
            "value": {"type": "string"},
            "press_enter": {"type": "boolean", "default": False}},
        "required": ["selector", "value"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        selector = (args.get("selector") or "").strip()
        value = args.get("value", "")
        press_enter = bool(args.get("press_enter", False))
        if not selector:
            return ToolResult(ok=False, error="selector gerekli")
        try:
            page = await browser_engine.get_page(context.agent_id)
            locator = page.locator(selector).first
            await locator.fill(value)
            if press_enter:
                await locator.press("Enter")
            return ToolResult(ok=True, output=f"Yazildi: {selector} = {value[:80]}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Fill hata: {exc}")


class BrowserScreenshotTool(BaseTool):
    name = "browser_screenshot"
    description = (
        "Aktif sayfanin ekran goruntusunu cek. Belirtilen path'e PNG yazar; "
        "ayrica UI'de gosterim icin base64 doner."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Kaydedilecek PNG yolu (opsiyonel)"},
            "selector": {"type": "string", "description": "Sadece bir oge (opsiyonel)"},
            "full_page": {"type": "boolean", "default": False}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        path = args.get("path") or ""
        selector = args.get("selector") or ""
        full_page = bool(args.get("full_page", False))

        from app.config import get_settings
        settings = get_settings()
        if not path:
            shots_dir = settings.data_dir / "screenshots"
            shots_dir.mkdir(parents=True, exist_ok=True)
            from datetime import datetime
            path = str(shots_dir / f"shot_{context.agent_id}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}.png")

        try:
            page = await browser_engine.get_page(context.agent_id)
            if selector:
                await page.locator(selector).first.screenshot(path=path)
            else:
                await page.screenshot(path=path, full_page=full_page)

            try:
                with open(path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode("ascii")
                if len(b64) > 200000:
                    b64 = ""  # cok buyukse UI'ye gondermeyelim
            except Exception:
                b64 = ""

            return ToolResult(
                ok=True,
                output=f"Ekran goruntusu: {path}",
                data={"path": path, "image_b64": b64},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Screenshot hata: {exc}")


class ReadWebpageTool(BaseTool):
    """FAZ 2.3: temiz makale metni cikarir (readability-lxml)."""

    name = "read_webpage"
    description = (
        "Bir web sayfasini Playwright ile yukler ve readability ile temiz "
        "makale metnini cikarir. Reklamlar, menuler vs. temizlenir."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string"},
            "max_chars": {"type": "integer", "default": 8000}},
        "required": ["url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        unavailable = _check_available()
        if unavailable:
            return unavailable
        url = (args.get("url") or "").strip()
        if not url:
            return ToolResult(ok=False, error="url gerekli")
        max_chars = int(args.get("max_chars", 8000))

        try:
            page = await browser_engine.get_page(context.agent_id)
            await page.goto(url, wait_until="domcontentloaded")
            html = await page.content()
            title = await page.title()
        except Exception as exc:
            return ToolResult(ok=False, error=f"Sayfa yuklenemedi: {exc}")

        # readability ile temiz metin
        clean_text = ""
        try:
            from readability import Document  # type: ignore  # pyright: ignore[reportMissingImports]
            doc = Document(html)
            summary_html = doc.summary()
            # HTML'den metin
            from lxml import html as lxml_html
            tree = lxml_html.fromstring(summary_html)
            clean_text = tree.text_content().strip()
            if not title:
                title = doc.short_title() or ""
        except ImportError:
            # fallback: plain body text
            try:
                clean_text = await page.evaluate("() => document.body.innerText")
            except Exception:
                clean_text = ""
        except Exception as exc:
            logger.warning("readability hatasi, fallback metin: %s", exc)
            try:
                clean_text = await page.evaluate("() => document.body.innerText")
            except Exception:
                clean_text = ""

        if not clean_text:
            return ToolResult(ok=False, error="Sayfadan metin cikarilamadi")

        if len(clean_text) > max_chars:
            clean_text = clean_text[:max_chars] + f"\n...[{len(clean_text) - max_chars} karakter kesildi]"

        output = f"# {title}\n\n{clean_text}" if title else clean_text
        return ToolResult(
            ok=True,
            output=output,
            data={"title": title, "url": url, "length": len(clean_text)},
        )