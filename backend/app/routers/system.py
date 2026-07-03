"""/api/system router'i - reset, env, versiyon, vs."""
from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

from app.config import get_settings
from app.database import engine
from app.services.agent_manager import agent_manager
from app.services.scheduler import shutdown_scheduler, start_scheduler_with_db

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/system", tags=["system"])


# ---- env yonetimi (Sprint A.7 / A.8) -------------------------------

# .env'de UI uzerinden duzenlemeye izin verdigimiz anahtarlar.
# Hassas anahtarlari maskeli donduruyoruz.
EDITABLE_ENV_KEYS = {
    "OPENAI_API_KEY": True,        # secret
    "ANTHROPIC_API_KEY": True,     # secret
    "OPENAI_BASE_URL": False,      # public
    "ANTHROPIC_BASE_URL": False,   # public
}


def _mask_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    s = value.strip()
    if not s:
        return None
    if len(s) <= 8:
        return "***" + s[-2:]
    return s[:4] + "***" + s[-4:]


def _read_env_file(path: Path) -> Dict[str, str]:
    if not path.exists():
        return {}
    out: Dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        out[key.strip()] = value.strip().strip('"').strip("'")
    return out


def _write_env_file(path: Path, values: Dict[str, str]) -> None:
    """.env dosyasini yeniden yazar; mevcut yorumlari korumaya calismaz (basit)."""
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["# Argus .env (UI uzerinden olusturuldu)"]
    for k, v in values.items():
        if v is None:
            continue
        # cift tirnak ile sar (icinde tirnak varsa kacir)
        safe = str(v).replace('"', '\\"')
        lines.append(f'{k}="{safe}"')
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


class EnvGetResponse(BaseModel):
    values: Dict[str, Optional[str]]
    masked: Dict[str, Optional[str]]
    has: Dict[str, bool]
    path: str


class EnvUpdateRequest(BaseModel):
    # None ile gonderilirse o anahtar silinir.
    values: Dict[str, Optional[str]]


class EnvUpdateResponse(BaseModel):
    ok: bool
    masked: Dict[str, Optional[str]]
    has: Dict[str, bool]


@router.get("/env", response_model=EnvGetResponse)
async def get_env() -> EnvGetResponse:
    """Duzenlenebilir .env anahtarlarini doner. Secret'lar maskeli gelir."""
    settings = get_settings()
    env_path = Path(settings.backend_dir) / ".env"
    raw = _read_env_file(env_path)

    values: Dict[str, Optional[str]] = {}
    masked: Dict[str, Optional[str]] = {}
    has: Dict[str, bool] = {}
    for key, is_secret in EDITABLE_ENV_KEYS.items():
        v = raw.get(key)
        has[key] = bool(v)
        if is_secret:
            values[key] = None  # ham deger asla disari verilmez
            masked[key] = _mask_secret(v)
        else:
            values[key] = v
            masked[key] = v
    return EnvGetResponse(
        values=values,
        masked=masked,
        has=has,
        path=str(env_path),
    )


@router.post("/env", response_model=EnvUpdateResponse)
async def update_env(payload: EnvUpdateRequest) -> EnvUpdateResponse:
    """Duzenlenebilir .env anahtarlarini gunceller (whitelist disindakileri yoksayar)."""
    settings = get_settings()
    env_path = Path(settings.backend_dir) / ".env"
    raw = _read_env_file(env_path)

    for key, val in payload.values.items():
        if key not in EDITABLE_ENV_KEYS:
            continue  # whitelist disi
        if val is None or (isinstance(val, str) and val.strip() == ""):
            raw.pop(key, None)
        else:
            raw[key] = val.strip()

    _write_env_file(env_path, raw)

    # get_settings cached; mevcut process icin refresh
    try:
        from app import config as _cfg
        _cfg.get_settings.cache_clear()  # type: ignore[attr-defined]
    except Exception:  # pragma: no cover
        pass

    masked: Dict[str, Optional[str]] = {}
    has: Dict[str, bool] = {}
    for key, is_secret in EDITABLE_ENV_KEYS.items():
        v = raw.get(key)
        has[key] = bool(v)
        masked[key] = _mask_secret(v) if is_secret else v

    logger.info(".env guncellendi: %s", list(payload.values.keys()))
    return EnvUpdateResponse(ok=True, masked=masked, has=has)


# ---- reset --------------------------------------------------------


class ResetResponse(BaseModel):
    ok: bool
    removed_agents: int
    message: str


@router.post("/reset", response_model=ResetResponse)
async def reset_system() -> ResetResponse:
    """Sistemi tamamen sifirla: tum ajanlari, sohbetleri, gorevleri, loglari sil."""
    settings = get_settings()

    # 1) Tum DB tablolarini temizle
    async with (engine if isinstance(engine, AsyncEngine) else engine).begin() as conn:
        await conn.execute(text("DELETE FROM messages"))
        await conn.execute(text("DELETE FROM conversations"))
        await conn.execute(text("DELETE FROM scheduled_tasks"))
        await conn.execute(text("DELETE FROM logs"))

    # 2) Scheduler'i yeniden yukle (tasks silindi)
    try:
        await shutdown_scheduler()
    except Exception:
        pass

    # 3) agents.yaml'i bosalt
    agents_count = len(agent_manager.list_agents(include_inactive=True))
    yaml_path = Path(settings.agents_config_path)
    yaml_path.parent.mkdir(parents=True, exist_ok=True)
    yaml_path.write_text("agents: []\n", encoding="utf-8")
    agent_manager.reload()

    # 4) Scheduler yeniden baslat
    try:
        await start_scheduler_with_db()
    except Exception:
        pass

    logger.info("Sistem sifirlandi (%d ajan silindi)", agents_count)
    return ResetResponse(
        ok=True,
        removed_agents=agents_count,
        message=f"Sistem sifirlandi. {agents_count} ajan ve tum veriler silindi.",
    )


class PluginInfo(BaseModel):
    """Eklenti bilgisi."""
    name: str
    loaded_tools: list[str]
    ok: bool


@router.get("/plugins", response_model=list[PluginInfo])
async def list_plugins() -> list[PluginInfo]:
    """Sistemdeki Python eklentilerini (plugins/ klasöründeki) listele."""
    try:
        from app.services.plugins.loader import plugin_loader
        plugins_dir = Path(get_settings().plugins_dir)
        if not plugins_dir.exists():
            return []

        loaded_tools = plugin_loader.loaded_tools
        results = []
        for py_file in plugins_dir.glob("*.py"):
            if py_file.name.startswith("_"):
                continue

            results.append(PluginInfo(
                name=py_file.name,
                loaded_tools=loaded_tools,
                ok=True
            ))
        return results
    except Exception as exc:
        logger.exception("Plugin listesi okuma hatasi")
        raise HTTPException(500, f"Plugin listesi okuma hatasi: {exc}")