"""Ajan ile ilgili Pydantic semalari."""
from __future__ import annotations

from typing import List, Literal, Optional

from pydantic import BaseModel, Field


# Sprint 4: Daha fazla provider
ProviderName = Literal[
    "openai",
    "anthropic",
    "local",
    "gemini",
    "ollama",
    "groq",
    "mistral",
    "deepseek",
    "xai",
    "openrouter"]


class MediaCapabilityInput(BaseModel):
    """Bir medya yetenegi icin opsiyonel yapilandirma (gorsel/video/ses)."""

    enabled: bool = False
    provider: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None


class AgentPermissions(BaseModel):
    """Ajanin sistem uzerindeki yetkilerini belirler."""

    file_system: bool = True
    terminal_cmd: bool = True
    web_search: bool = True
    system_admin: bool = True



class MediaCapabilityOut(BaseModel):
    """Response'larda donen medya bilgisi (api_key maskelenir)."""

    enabled: bool = False
    provider: Optional[str] = None
    model: Optional[str] = None
    base_url: Optional[str] = None
    api_key_masked: Optional[str] = None
    has_api_key: bool = False


class AgentInfo(BaseModel):
    """Ajan listesinde gosterilen ozet bilgi."""

    id: str
    name: str
    role: str
    provider: str
    model: str
    description: Optional[str] = None
    is_active: bool = True
    tags: List[str] = Field(default_factory=list)
    has_api_key: bool = False
    has_base_url: bool = False
    # Hangi medya yetenekleri aciktir?
    media_image: bool = False
    media_video: bool = False
    media_audio: bool = False
    permissions: AgentPermissions = Field(default_factory=AgentPermissions)



class AgentDetail(AgentInfo):
    """Ajan detayi."""

    system_prompt: str = ""
    temperature: float = 0.7
    max_tokens: int = 1024
    base_url: Optional[str] = None
    # Guvenlik: gercek api_key'i geri dondurmuyoruz, yalnizca maskelenmis hali.
    api_key_masked: Optional[str] = None
    # Medya yapilandirmalari (detayda gosterilir, api_key maskelenir)
    image: MediaCapabilityOut = Field(default_factory=MediaCapabilityOut)
    video: MediaCapabilityOut = Field(default_factory=MediaCapabilityOut)
    audio: MediaCapabilityOut = Field(default_factory=MediaCapabilityOut)


class AgentCreate(BaseModel):
    """Yeni ajan olusturma girdisi."""

    name: str = Field(..., min_length=1, max_length=120)
    role: str = Field("", max_length=160)
    description: str = Field("", max_length=500)
    provider: ProviderName = "openai"
    model: str = Field("gpt-4o-mini", min_length=1, max_length=160)
    system_prompt: str = Field("", max_length=20000)
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=16, le=32000)
    tags: List[str] = Field(default_factory=list)
    is_active: bool = True
    # Opsiyonel medya yetenekleri
    image: Optional[MediaCapabilityInput] = None
    video: Optional[MediaCapabilityInput] = None
    audio: Optional[MediaCapabilityInput] = None
    permissions: AgentPermissions = Field(default_factory=AgentPermissions)



class AgentUpdate(BaseModel):
    """Ajan kismi guncelleme girdisi. Alanlar opsiyoneldir."""

    name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    provider: Optional[ProviderName] = None
    model: Optional[str] = None
    system_prompt: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    clear_api_key: Optional[bool] = False
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(None, ge=16, le=32000)
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    image: Optional[MediaCapabilityInput] = None
    video: Optional[MediaCapabilityInput] = None
    audio: Optional[MediaCapabilityInput] = None
    permissions: Optional[AgentPermissions] = None



class ConnectionTestRequest(BaseModel):
    """Provider bagini dogrulamak icin minik test istegi."""

    provider: ProviderName
    model: str = Field(..., min_length=1, max_length=160)
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    agent_id: Optional[str] = None
    verify_ssl: Optional[bool] = True


class ConnectionTestResponse(BaseModel):
    ok: bool
    provider: str
    model: str
    latency_ms: int = 0
    message: str = ""
    sample_response: Optional[str] = None


class ModelInfoOut(BaseModel):
    id: str
    label: str
    description: Optional[str] = None


class ModelsCatalogOut(BaseModel):
    """Frontend dropdown'unda kullanilacak model katalogu."""

    openai: List[ModelInfoOut]
    anthropic: List[ModelInfoOut]
    local: List[ModelInfoOut] = Field(default_factory=list)
    gemini: List[ModelInfoOut] = Field(default_factory=list)
    ollama: List[ModelInfoOut] = Field(default_factory=list)
    groq: List[ModelInfoOut] = Field(default_factory=list)
    mistral: List[ModelInfoOut] = Field(default_factory=list)
    deepseek: List[ModelInfoOut] = Field(default_factory=list)
    xai: List[ModelInfoOut] = Field(default_factory=list)
    openrouter: List[ModelInfoOut] = Field(default_factory=list)


# ============================================================
# Sprint A.11 — Souls CRUD ve Bulk Provider Update
# ============================================================


class SoulInfo(BaseModel):
    """Bir SOUL dosyasinin ozet bilgisi (souls/*.md)."""

    name: str           # 'developer' (uzantisiz)
    filename: str       # 'developer.md'
    preview: str        # ilk 200 karakter
    size: int           # bytes
    is_system: bool = False  # Sistem soul'lari (silinemez)


class SoulDetail(SoulInfo):
    content: str        # tam icerik


class SoulCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    content: str = Field(..., min_length=1)
    overwrite: bool = False


class BulkProviderUpdateRequest(BaseModel):
    provider: ProviderName
    base_url: Optional[str] = None
    model: Optional[str] = None  # Opsiyonel: belirtilirse modeli de degistirir
    agent_ids: Optional[List[str]] = None  # None -> 'sa' disindaki tum aktif ajanlar
    skip_ids: List[str] = Field(default_factory=lambda: ["sa"])


class BulkProviderUpdateResponse(BaseModel):
    updated: int
    skipped: int
    agent_ids: List[str]