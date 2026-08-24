"""Uygulama yapilandirmasi - ortam degiskenlerinden yuklenir."""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Pydantic tabanli ayarlar. `.env` dosyasindan ve ortam degiskenlerinden yuklenir."""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Ortam
    app_env: str = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000

    # Veritabani
    database_url: str = f"sqlite+aiosqlite:///{(BACKEND_DIR / 'data' / 'argus.db').as_posix()}"

    # CORS - virgulle ayrilmis string olarak tutuluyor (pydantic-settings JSON
    # parse etmesin diye); property ile listeye donusturulur.
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:8000,http://127.0.0.1:8000"
    )

    # LLM anahtarlari
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
<<<<<<< HEAD
    SAMBANOVA_API_KEY: Optional[str] = None
    CEREBRAS_API_KEY: Optional[str] = None
    FIREWORKS_API_KEY: Optional[str] = None
    TOGETHER_API_KEY: Optional[str] = None
=======
    openrouter_api_key: str | None = None
    groq_api_key: str | None = None
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)

    # Guvenlik limitleri
    max_tokens_per_request: int = 2048
    max_history_messages: int = 30

    # Ajan yapilandirma yollari
    agents_config_path: str = str(BACKEND_DIR / "agents" / "agents.yaml")
    souls_dir: str = str(BACKEND_DIR / "agents" / "souls")

    # Planning (FAZ 1)
    plan_max_steps: int = 7
    plan_reflection_enabled: bool = True
    plan_retry_limit: int = 2
    audit_hmac_secret: str | None = None  # boşsa otomatik üretilir

    # Browser (FAZ 2)
    browser_headless: bool = True
    browser_timeout_ms: int = 30000

    # Memory (FAZ 3)
    embedding_provider: str = "local"  # local | openai
    embedding_model_local: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_model_openai: str = "text-embedding-3-small"
    chroma_path: str = str(BACKEND_DIR / "data" / "chroma")
    knowledge_graph_path: str = str(BACKEND_DIR / "data" / "knowledge_graph.json")

    # Sandbox / Rate (FAZ 7)
    run_command_allowlist: str = "git,npm,python,pip,node,echo,dir,ls,cat,type,where,pwd,hostname"
    run_command_cwd_jail: str = ""
    rate_limit_openai_rpm: int = 60
    rate_limit_openai_tpm: int = 200000
    rate_limit_anthropic_rpm: int = 50
    rate_limit_anthropic_tpm: int = 100000

    # Observability (FAZ 8)
    log_format: str = "text"  # text | json
    voice_enabled: bool = False

    # Plugins
    plugins_dir: str = str(BACKEND_DIR.parent / "plugins")

    @property
    def cors_origins_list(self) -> List[str]:
        """Virgulle ayrilmis stringi liste olarak doner."""
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    @property
    def backend_dir(self) -> Path:
        return BACKEND_DIR

    @property
    def data_dir(self) -> Path:
        return BACKEND_DIR / "data"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Tek sefer olusturulan (cached) ayarlar singleton."""
    settings = Settings()
    # Veri klasorunu garantile
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    return settings