"""FastAPI uygulamasi giris noktasi."""
from __future__ import annotations

import logging
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routers import (
    agents_router,
    approvals_router,
    chat_router,
    coordinator_router,
    logs_router,
    mcp_router,
    memory_router,
    skills_router,
    system_router,
    tasks_router,
    voice_router,
    workflows_router,
    ws_router,
)
from app.services.agent_manager import agent_manager
from app.services.browser import browser_engine
from app.services.llm.factory import close_all as close_llm_clients
from app.services.observability import setup_logging
from app.services.observability.trace import TRACE_ID_VAR
from app.services.plugins import plugin_loader
from app.services.scheduler import shutdown_scheduler, start_scheduler_with_db


# Once basit logging - setup_logging() lifespan'de override edebilir
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
)
logger = logging.getLogger("argus")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Baslangic
    setup_logging()
    logger.info("Uygulama baslatiliyor...")
    await init_db()
    agent_manager.load()
    await start_scheduler_with_db()

    # Plugin'leri yukle
    try:
        plugin_loader.load_all()
    except Exception as exc:
        logger.warning("Plugin yukleme hata: %s", exc)

    # MCP bridge (opsiyonel)
    try:
        from app.services.mcp import mcp_bridge
        await mcp_bridge.connect_all()
    except Exception as exc:
        logger.warning("MCP baglanti hata: %s", exc)

    # Sprint C.3: Chromium otomatik indir (background, browser tool ihtiyaci olunca hazir)
    try:
        import asyncio as _asyncio
        from app.services.browser.installer import ensure_chromium_installed

        async def _bg_install():
            try:
                ok = await ensure_chromium_installed()
                if ok:
                    logger.info("Playwright Chromium hazir.")
                else:
                    logger.warning("Playwright Chromium indirilemedi (optional)")
            except Exception as exc:  # pragma: no cover
                logger.warning("Chromium auto-install hata: %s", exc)

        _asyncio.create_task(_bg_install())
    except Exception as exc:  # pragma: no cover
        logger.warning("Chromium installer baslatilamadi: %s", exc)

    logger.info("Uygulama hazir.")
    yield

    # Kapanis
    logger.info("Uygulama kapaniyor...")
    await shutdown_scheduler()
    try:
        await browser_engine.shutdown()
    except Exception as exc:
        logger.warning("Browser shutdown hata: %s", exc)
    try:
        from app.services.mcp import mcp_bridge
        await mcp_bridge.shutdown()
    except Exception as exc:
        logger.warning("MCP shutdown hata: %s", exc)
    await close_llm_clients()
    logger.info("Kapanis tamamlandi.")


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="Argus - Çoklu Ajan Sistemi",
        description=(
            "Argus: Aynı anda her şeyi gören çoklu ajan sistemi."
        ),
        version="0.2.0",
        lifespan=lifespan,
    )

    # Electron file:// origin'i "null" olarak gelir; regex ile tum kaynaklara
    # izin veriyoruz. CORS spec'i geregi allow_origin_regex=".*" ile birlikte
    # allow_credentials=True kullanilamaz (browser reddeder), bu yuzden
    # credentials kapali tutuluyor. Local desktop uygulamasinda cookie/auth
    # yok zaten.
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["x-trace-id"],
    )

    # Trace-id middleware (FAZ 8.1)
    @app.middleware("http")
    async def trace_id_middleware(request: Request, call_next):
        existing = request.headers.get("x-trace-id")
        tid = existing or uuid.uuid4().hex[:16]
        token = TRACE_ID_VAR.set(tid)
        try:
            response = await call_next(request)
            response.headers["x-trace-id"] = tid
            return response
        finally:
            TRACE_ID_VAR.reset(token)

    app.include_router(agents_router)
    app.include_router(chat_router)
    app.include_router(tasks_router)
    app.include_router(logs_router)
    app.include_router(system_router)
    app.include_router(ws_router)
    app.include_router(approvals_router)
    app.include_router(workflows_router)
    app.include_router(voice_router)
    app.include_router(memory_router)
    app.include_router(coordinator_router)
    app.include_router(skills_router)
    app.include_router(mcp_router)

    @app.get("/api/health", tags=["health"])
    async def health() -> dict:
        return {
            "status": "ok",
            "version": app.version,
            "agents_loaded": len(agent_manager.list_agents(include_inactive=True))}

    @app.get("/", tags=["health"])
    async def root() -> dict:
        return {
            "name": "UmtalAgent - AI Ajan Sistemi",
            "docs": "/docs",
            "health": "/api/health"}

    return app


app = create_app()