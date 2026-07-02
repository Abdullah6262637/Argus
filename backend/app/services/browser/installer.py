"""Chromium auto-installer for Playwright.

Playwright kurulu ama Chromium binary'si yoksa, ilk kullanimda otomatik
indirir. Tek seferlik async lock ile race condition'lar onlenir.

Kullanim:
    await ensure_chromium_installed()
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)


_install_lock = asyncio.Lock()
_install_done: Optional[bool] = None


def _chromium_already_installed() -> bool:
    """Playwright'in Chromium klasorunde executable bulunmasini kontrol et."""
    try:
        from playwright._impl._driver import compute_driver_executable  # type: ignore
    except Exception:
        # Eski/yeni surum farki -- klasor tabanli kontrole dus
        pass

    # Default cache yolu (Windows: %USERPROFILE%\AppData\Local\ms-playwright)
    cache_dir = (
        os.environ.get("PLAYWRIGHT_BROWSERS_PATH")
        or os.environ.get("PLAYWRIGHT_BROWSERS_CACHE")
    )
    if cache_dir:
        base = Path(cache_dir)
    else:
        if sys.platform == "win32":
            base = Path(os.environ.get("USERPROFILE", "~")).expanduser() / "AppData" / "Local" / "ms-playwright"
        elif sys.platform == "darwin":
            base = Path.home() / "Library" / "Caches" / "ms-playwright"
        else:
            base = Path.home() / ".cache" / "ms-playwright"

    if not base.exists():
        return False
    # chromium-* klasoru var mi?
    for child in base.iterdir():
        if child.is_dir() and child.name.startswith("chromium"):
            # Icinde chrome.exe / chrome arar
            for item in child.rglob("chrome*"):
                if item.is_file() and os.access(item, os.X_OK):
                    return True
            # Sadece varligin yetebilir
            return True
    return False


async def ensure_chromium_installed(force: bool = False) -> bool:
    """Chromium'u indir (yoksa). True dondurur eger Chromium artik kurulu.

    Idempotent: ayni process icinde tekrar cagrilirsa hizla doner.
    """
    global _install_done

    # Playwright modulunun kendisi var mi?
    try:
        import playwright  # type: ignore  # pyright: ignore[reportMissingImports]  # noqa: F401
    except ImportError:
        logger.warning("playwright paketi kurulu degil; pip install playwright")
        return False

    if not force and _install_done is True:
        return True

    if not force and _chromium_already_installed():
        _install_done = True
        return True

    async with _install_lock:
        # Lock alindiktan sonra yeniden kontrol
        if not force and _install_done is True:
            return True
        if not force and _chromium_already_installed():
            _install_done = True
            return True

        logger.info("Chromium indiriliyor (playwright install chromium) ...")
        proc = await asyncio.create_subprocess_exec(
            sys.executable,
            "-m",
            "playwright",
            "install",
            "chromium",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        out_bytes, _ = await proc.communicate()
        out = out_bytes.decode("utf-8", errors="replace") if out_bytes else ""

        if proc.returncode == 0:
            logger.info("Chromium indirme tamam.")
            _install_done = True
            return True

        logger.error(
            "Chromium indirme basarisiz (returncode=%s). Cikti:\n%s",
            proc.returncode,
            out[-2000:],
        )
        _install_done = False
        return False