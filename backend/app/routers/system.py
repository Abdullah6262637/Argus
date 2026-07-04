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
    deleted_size_mb: float
    message: str


@router.post("/reset", response_model=ResetResponse)
async def reset_system() -> ResetResponse:
    """Sistemi tamamen sifirla: tum ajanlari, sohbetleri, gorevleri, loglari sil."""
    settings = get_settings()

    # Calculate current DB and logs size before deleting
    deleted_size = 0.0
    db_path_str = settings.database_url.replace("sqlite+aiosqlite:///", "")
    db_path = Path(db_path_str)
    
    # Handle relative paths resolved from backend directory
    if not db_path.is_absolute():
        db_path = Path(settings.backend_dir) / db_path
        
    if db_path.exists():
        deleted_size += db_path.stat().st_size / (1024 * 1024)

    # Calculate Chroma DB size if exists
    chroma_dir = Path(settings.chroma_path)
    if chroma_dir.exists():
        for root, _, files in os.walk(chroma_dir):
            for f in files:
                deleted_size += os.path.getsize(os.path.join(root, f)) / (1024 * 1024)

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

    logger.info("Sistem sifirlandi (%d ajan silindi, %.2f MB silindi)", agents_count, deleted_size)
    return ResetResponse(
        ok=True,
        removed_agents=agents_count,
        deleted_size_mb=round(deleted_size, 2),
        message=f"Sistem sifirlandi. {agents_count} ajan ve tum veriler ({deleted_size:.2f} MB) silindi.",
    )



class DoctorCheckResult(BaseModel):
    ok: bool
    details: str


class DoctorResponse(BaseModel):
    node: DoctorCheckResult
    python: DoctorCheckResult
    sqlite: DoctorCheckResult


@router.get("/doctor", response_model=DoctorResponse)
async def system_doctor() -> DoctorResponse:
    """Sistem bilesenlerinin durumunu kontrol eder."""
    import sys
    import os
    import subprocess
    
    # 1. Python Check
    py_ok = True
    py_details = f"Python {sys.version.split()[0]} ({sys.executable})"
    
    # 2. Node Check
    node_ok = False
    node_details = "Node.js executable not found"
    try:
        res = subprocess.run(["node", "-v"], capture_output=True, text=True, check=True)
        node_ok = True
        node_details = f"Node.js {res.stdout.strip()}"
    except Exception as exc:
        node_details = f"Node check failed: {exc}"
        
    # 3. Database Check
    db_ok = False
    db_details = "Not connected"
    try:
        async with (engine if isinstance(engine, AsyncEngine) else engine).begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
        
        # Calculate database file size for reporting
        settings = get_settings()
        db_path_str = settings.database_url.replace("sqlite+aiosqlite:///", "")
        db_path = Path(db_path_str)
        if not db_path.is_absolute():
            db_path = Path(settings.backend_dir) / db_path
            
        if db_path.exists():
            sz_mb = db_path.stat().st_size / (1024 * 1024)
            db_details = f"SQLite Active ({sz_mb:.2f} MB)"
        else:
            db_details = f"SQLite Active"
    except Exception as exc:
        db_details = f"SQLite connection failed: {exc}"
        
    return DoctorResponse(
        node=DoctorCheckResult(ok=node_ok, details=node_details),
        python=DoctorCheckResult(ok=py_ok, details=py_details),
        sqlite=DoctorCheckResult(ok=db_ok, details=db_details),
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



# ---- setup wizard --------------------------------------------------

class SetupStatusResponse(BaseModel):
    initialized: bool
    env_keys_present: Dict[str, bool]


class SetupSaveRequest(BaseModel):
    openai_key: Optional[str] = None
    anthropic_key: Optional[str] = None
    gemini_key: Optional[str] = None
    openrouter_key: Optional[str] = None


@router.get("/setup-status", response_model=SetupStatusResponse)
async def setup_status() -> SetupStatusResponse:
    """Sistemin ilk kurulum durumunu sorgular."""
    settings = get_settings()
    env_path = Path(settings.backend_dir) / ".env"
    raw = _read_env_file(env_path)
    
    env_keys_present = {
        "OPENAI_API_KEY": bool(raw.get("OPENAI_API_KEY")),
        "ANTHROPIC_API_KEY": bool(raw.get("ANTHROPIC_API_KEY")),
        "GEMINI_API_KEY": bool(raw.get("GEMINI_API_KEY")),
        "OPENROUTER_API_KEY": bool(raw.get("OPENROUTER_API_KEY")),
    }
    
    # Eger en az bir anahtar girilmis ya da kurulum tamamlandiysa true don
    initialized = raw.get("ARGUS_INITIALIZED") == "true" or any(env_keys_present.values())
    return SetupStatusResponse(initialized=initialized, env_keys_present=env_keys_present)


@router.post("/setup-save")
async def setup_save(payload: SetupSaveRequest):
    """Kurulum anahtarlarini .env'e yazar ve kurulumu tamamlar."""
    settings = get_settings()
    env_path = Path(settings.backend_dir) / ".env"
    raw = _read_env_file(env_path)
    
    if payload.openai_key:
        raw["OPENAI_API_KEY"] = payload.openai_key.strip()
    if payload.anthropic_key:
        raw["ANTHROPIC_API_KEY"] = payload.anthropic_key.strip()
    if payload.gemini_key:
        raw["GEMINI_API_KEY"] = payload.gemini_key.strip()
    if payload.openrouter_key:
        raw["OPENROUTER_API_KEY"] = payload.openrouter_key.strip()
        
    raw["ARGUS_INITIALIZED"] = "true"
    _write_env_file(env_path, raw)
    
    try:
        from app import config as _cfg
        _cfg.get_settings.cache_clear()  # type: ignore[attr-defined]
    except Exception:
        pass
        
    logger.info("Argus ilk kurulum basariyla tamamlandi.")
    return {"ok": True}