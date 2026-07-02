"""PlaywrightEngine: tek-instance managed browser.

Lifespan'de start_engine ile baslatilir, shutdown_engine ile kapatilir.
Her agent'a ayri BrowserContext (cookie izolasyonu) verilir.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)


class PlaywrightEngine:
    """Tek instance browser singleton'i."""

    def __init__(self) -> None:
        self._lock = asyncio.Lock()
        self._playwright: Any = None
        self._browser: Any = None
        # agent_id -> {context, page}
        self._sessions: Dict[str, Dict[str, Any]] = {}
        self._headless: bool = True
        self._timeout_ms: int = 30000
        self._available: Optional[bool] = None  # None=henuz dene, True/False=bilinen

    @property
    def available(self) -> bool:
        """Playwright yuklu ve baslatilabilir mi?"""
        if self._available is None:
            try:
                from playwright.async_api import async_playwright  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
                self._available = True
            except ImportError:
                self._available = False
        return self._available

    async def start(self, *, headless: Optional[bool] = None, timeout_ms: Optional[int] = None) -> None:
        """Browser'i baslat. Lifespan'de cagrilir; tembel olarak da cagrilabilir."""
        if not self.available:
            logger.warning("Playwright kurulu degil; browser engine baslatilmadi")
            return
        async with self._lock:
            if self._browser is not None:
                return
            from playwright.async_api import async_playwright  # type: ignore  # pyright: ignore[reportMissingImports]

            from app.config import get_settings
            settings = get_settings()
            self._headless = headless if headless is not None else settings.browser_headless
            self._timeout_ms = timeout_ms if timeout_ms is not None else settings.browser_timeout_ms

            self._playwright = await async_playwright().start()
            try:
                self._browser = await self._playwright.chromium.launch(
                    headless=self._headless,
                    args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
                )
                logger.info("Playwright Chromium baslatildi (headless=%s)", self._headless)
            except Exception as exc:
                # Chromium binary yoksa otomatik kurmayi dene
                err_msg = str(exc).lower()
                if "executable doesn't exist" in err_msg or "playwright install" in err_msg:
                    logger.warning("Chromium binary bulunamadi, otomatik indirme deneniyor...")
                    await self._playwright.stop()
                    self._playwright = None
                    try:
                        from app.services.browser.installer import ensure_chromium_installed
                        ok = await ensure_chromium_installed(force=True)
                        if not ok:
                            self._available = False
                            raise
                        # Yeniden dene
                        self._playwright = await async_playwright().start()
                        self._browser = await self._playwright.chromium.launch(
                            headless=self._headless,
                            args=["--no-sandbox", "--disable-blink-features=AutomationControlled"],
                        )
                        logger.info("Chromium otomatik indirme sonrasi baslatildi")
                    except Exception as exc2:
                        logger.error("Chromium baslatilamadi (auto-install sonrasi): %s", exc2)
                        if self._playwright is not None:
                            await self._playwright.stop()
                            self._playwright = None
                        self._available = False
                        raise
                else:
                    logger.error("Chromium baslatilamadi: %s", exc)
                    await self._playwright.stop()
                    self._playwright = None
                    self._available = False
                    raise

    async def get_page(self, agent_id: str) -> Any:
        """Agent icin Page nesnesi (yoksa olustur)."""
        if not self.available:
            raise RuntimeError(
                "Playwright kurulu degil. Yuklemek icin: pip install playwright && playwright install chromium"
            )
        if self._browser is None:
            await self.start()
        if self._browser is None:
            raise RuntimeError("Browser baslatilamadi")

        async with self._lock:
            session = self._sessions.get(agent_id)
            if session is None:
                ctx = await self._browser.new_context(
                    viewport={"width": 1280, "height": 800},
                    user_agent=(
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) "
                        "Chrome/120.0 Safari/537.36 UmtalAgent/1.0"
                    ),
                )
                ctx.set_default_timeout(self._timeout_ms)
                page = await ctx.new_page()
                self._sessions[agent_id] = {"context": ctx, "page": page}
                logger.info("Browser context olusturuldu: agent=%s", agent_id)
            return self._sessions[agent_id]["page"]

    async def close_agent(self, agent_id: str) -> None:
        async with self._lock:
            session = self._sessions.pop(agent_id, None)
            if session:
                try:
                    await session["context"].close()
                except Exception as exc:  # pragma: no cover
                    logger.warning("Context kapatma hata: %s", exc)

    async def shutdown(self) -> None:
        """Tum browser kaynaklarini kapat."""
        async with self._lock:
            for agent_id, session in list(self._sessions.items()):
                try:
                    await session["context"].close()
                except Exception:
                    pass
            self._sessions.clear()
            if self._browser is not None:
                try:
                    await self._browser.close()
                except Exception as exc:  # pragma: no cover
                    logger.warning("Browser kapatma hata: %s", exc)
                self._browser = None
            if self._playwright is not None:
                try:
                    await self._playwright.stop()
                except Exception as exc:  # pragma: no cover
                    logger.warning("Playwright stop hata: %s", exc)
                self._playwright = None


# Singleton
browser_engine = PlaywrightEngine()