"""/api/agents router'i."""
from __future__ import annotations

import re
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.models import Conversation, Message
from app.schemas.agent import (
    AgentCreate,
    AgentDetail,
    AgentInfo,
    AgentUpdate,
    BulkProviderUpdateRequest,
    BulkProviderUpdateResponse,
    ConnectionTestRequest,
    ConnectionTestResponse,
    MediaCapabilityOut,
    ModelInfoOut,
    ModelsCatalogOut,
    SoulCreate,
    SoulDetail,
    SoulInfo,
)
from app.schemas.chat import ConversationOut
from app.services.agent_manager import AgentDefinition, AgentManager, get_agent_manager
from app.services.llm.models_catalog import MODELS_BY_PROVIDER
from app.services.llm.tester import test_connection

router = APIRouter(prefix="/api/agents", tags=["agents"])

# ---- Sprint A.11: Souls helpers ----

# Sistem soul'lari (Sprint A ile gelen 12 sablon)
_SYSTEM_SOULS = {
    "developer", "researcher", "writer", "social_media", "devops",
    "data_analyst", "project_manager", "customer_support", "code_reviewer",
    "translator", "marketing", "tutor"}

_SOUL_NAME_RE = re.compile(r"^[a-zA-Z0-9_\-]+$")


def _souls_dir() -> Path:
    return Path(get_settings().souls_dir)


def _validate_soul_name(name: str) -> str:
    n = (name or "").strip().removesuffix(".md")
    if not n or not _SOUL_NAME_RE.match(n):
        raise HTTPException(400, "Soul adi yalnizca a-z, A-Z, 0-9, '_' ve '-' icerebilir.")
    return n


def _soul_to_info(path: Path) -> SoulInfo:
    name = path.stem
    content = path.read_text(encoding="utf-8")
    preview = content.strip()[:200]
    if len(content.strip()) > 200:
        preview += "..."
    return SoulInfo(
        name=name,
        filename=path.name,
        preview=preview,
        size=path.stat().st_size,
        is_system=name in _SYSTEM_SOULS,
    )


def _mask_key(key: Optional[str]) -> Optional[str]:
    if not key:
        return None
    if len(key) <= 8:
        return "***" + key[-2:]
    return key[:4] + "***" + key[-4:]


def _cap_to_out(cap) -> MediaCapabilityOut:
    return MediaCapabilityOut(
        enabled=bool(cap.enabled),
        provider=cap.provider,
        model=cap.model,
        base_url=cap.base_url,
        api_key_masked=_mask_key(cap.api_key),
        has_api_key=bool(cap.api_key),
    )


def _def_to_info(d: AgentDefinition) -> AgentInfo:
    return AgentInfo(
        id=d.id,
        name=d.name,
        role=d.role,
        provider=d.provider,
        model=d.model,
        description=d.description,
        is_active=d.is_active,
        tags=d.tags,
        has_api_key=bool(d.api_key),
        has_base_url=bool(d.base_url),
        media_image=bool(d.image and d.image.enabled),
        media_video=bool(d.video and d.video.enabled),
        media_audio=bool(d.audio and d.audio.enabled),
    )


def _def_to_detail(d: AgentDefinition) -> AgentDetail:
    return AgentDetail(
        id=d.id,
        name=d.name,
        role=d.role,
        provider=d.provider,
        model=d.model,
        description=d.description,
        is_active=d.is_active,
        tags=d.tags,
        system_prompt=d.system_prompt,
        temperature=d.temperature,
        max_tokens=d.max_tokens,
        base_url=d.base_url,
        api_key_masked=_mask_key(d.api_key),
        has_api_key=bool(d.api_key),
        has_base_url=bool(d.base_url),
        image=_cap_to_out(d.image),
        video=_cap_to_out(d.video),
        audio=_cap_to_out(d.audio),
        media_image=bool(d.image and d.image.enabled),
        media_video=bool(d.video and d.video.enabled),
        media_audio=bool(d.audio and d.audio.enabled),
    )


@router.get("", response_model=List[AgentInfo])
async def list_agents(
    include_inactive: bool = False,
    manager: AgentManager = Depends(get_agent_manager)
) -> List[AgentInfo]:
    return [_def_to_info(a) for a in manager.list_agents(include_inactive)]


@router.post("/reload", response_model=List[AgentInfo])
async def reload_agents(manager: AgentManager = Depends(get_agent_manager)) -> List[AgentInfo]:
    """agents.yaml dosyasini yeniden yukler."""
    manager.reload()
    return [_def_to_info(a) for a in manager.list_agents()]


# ============================================================
# Sprint A.11: Souls CRUD
# ============================================================


@router.get("/souls", response_model=List[SoulInfo])
async def list_souls() -> List[SoulInfo]:
    """souls/*.md dosyalarini listeler."""
    sd = _souls_dir()
    if not sd.exists():
        return []
    out: List[SoulInfo] = []
    for p in sorted(sd.glob("*.md")):
        try:
            out.append(_soul_to_info(p))
        except Exception:  # pragma: no cover
            continue
    return out


@router.get("/souls/{name}", response_model=SoulDetail)
async def get_soul(name: str) -> SoulDetail:
    name = _validate_soul_name(name)
    path = _souls_dir() / f"{name}.md"
    if not path.exists():
        raise HTTPException(404, f"Soul bulunamadi: {name}")
    content = path.read_text(encoding="utf-8")
    info = _soul_to_info(path)
    return SoulDetail(**info.model_dump(), content=content)


@router.post("/souls", response_model=SoulInfo, status_code=201)
async def create_soul(payload: SoulCreate) -> SoulInfo:
    """Yeni bir SOUL dosyasi olusturur (.md)."""
    name = _validate_soul_name(payload.name)
    sd = _souls_dir()
    sd.mkdir(parents=True, exist_ok=True)
    path = sd / f"{name}.md"
    if path.exists() and not payload.overwrite:
        raise HTTPException(409, f"Soul zaten var: {name} (overwrite=true ile uzerine yazabilirsin)")
    path.write_text(payload.content, encoding="utf-8")
    return _soul_to_info(path)


@router.delete("/souls/{name}", status_code=204)
async def delete_soul(name: str) -> None:
    name = _validate_soul_name(name)
    if name in _SYSTEM_SOULS:
        raise HTTPException(409, f"Sistem soul'u silinemez: {name}")
    path = _souls_dir() / f"{name}.md"
    if not path.exists():
        raise HTTPException(404, f"Soul bulunamadi: {name}")
    path.unlink()


# ============================================================
# Sprint A.11: Bulk Provider Update
# ============================================================


@router.post("/bulk-provider-update", response_model=BulkProviderUpdateResponse)
async def bulk_update_provider(
    payload: BulkProviderUpdateRequest,
    manager: AgentManager = Depends(get_agent_manager)
) -> BulkProviderUpdateResponse:
    """Birden fazla ajanin provider/base_url/model bilgisini topluca gunceller.

    - agent_ids verilmezse tum aktif ajanlar (skip_ids haric) hedeflenir.
    - Default skip_ids = ["sa"] (varsayilan asistan korunur).
    """
    skip = set(payload.skip_ids or [])
    if payload.agent_ids:
        target_ids = [aid for aid in payload.agent_ids if aid not in skip]
    else:
        all_agents = manager.list_agents(include_inactive=True)
        target_ids = [a.id for a in all_agents if a.id not in skip]

    updated_ids: List[str] = []
    skipped = 0
    for aid in target_ids:
        agent = manager.get(aid)
        if not agent:
            skipped += 1
            continue
        changes: dict = {"provider": payload.provider}
        if payload.base_url is not None:
            changes["base_url"] = payload.base_url or None  # bos string -> None
        if payload.model:
            changes["model"] = payload.model
        try:
            manager.update_agent(aid, **changes)
            updated_ids.append(aid)
        except Exception:  # pragma: no cover
            skipped += 1

    return BulkProviderUpdateResponse(
        updated=len(updated_ids),
        skipped=skipped + (len(payload.agent_ids or []) - len(target_ids) if payload.agent_ids else 0),
        agent_ids=updated_ids,
    )


# ============================================================
# Models / Test
# ============================================================


@router.get("/models", response_model=ModelsCatalogOut)
async def get_models_catalog() -> ModelsCatalogOut:
    """Guncel model katalogu (provider bazinda oneri listesi)."""
    def to_out(items):
        return [
            ModelInfoOut(id=m["id"], label=m.get("label", m["id"]),
                        description=m.get("description"))
            for m in items
        ]
    return ModelsCatalogOut(
        openai=to_out(MODELS_BY_PROVIDER.get("openai", [])),
        anthropic=to_out(MODELS_BY_PROVIDER.get("anthropic", [])),
<<<<<<< HEAD
        local=to_out(MODELS_BY_PROVIDER.get("local", [])),
=======
        local=to_out(MODELS_BY_PROVIDER.get("local", []) or MODELS_BY_PROVIDER.get("ollama", [])),
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
        gemini=to_out(MODELS_BY_PROVIDER.get("gemini", [])),
        ollama=to_out(MODELS_BY_PROVIDER.get("ollama", [])),
        groq=to_out(MODELS_BY_PROVIDER.get("groq", [])),
        mistral=to_out(MODELS_BY_PROVIDER.get("mistral", [])),
        deepseek=to_out(MODELS_BY_PROVIDER.get("deepseek", [])),
        xai=to_out(MODELS_BY_PROVIDER.get("xai", [])),
        openrouter=to_out(MODELS_BY_PROVIDER.get("openrouter", [])),
<<<<<<< HEAD
        sambanova=to_out(MODELS_BY_PROVIDER.get("sambanova", [])),
        cerebras=to_out(MODELS_BY_PROVIDER.get("cerebras", [])),
        fireworks=to_out(MODELS_BY_PROVIDER.get("fireworks", [])),
        together=to_out(MODELS_BY_PROVIDER.get("together", [])),
=======
>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
    )


@router.post("/test", response_model=ConnectionTestResponse)
async def test_agent_connection(
    payload: ConnectionTestRequest,
    manager: AgentManager = Depends(get_agent_manager)
) -> ConnectionTestResponse:
    """Verilen provider/model/api_key/base_url kombinasyonunu veya mevcut ajanin baglantisini test eder."""
    provider = payload.provider
    model = payload.model
    api_key = payload.api_key
    base_url = payload.base_url

    if payload.agent_id:
        agent = manager.get(payload.agent_id)
        if agent:
            if not api_key or "xx" in api_key.lower() or api_key == "":
                api_key = agent.api_key
            if not base_url:
                base_url = agent.base_url
            provider = agent.provider
            model = agent.model

    result = await test_connection(
        provider=provider,
        model=model,
        api_key=api_key,
        base_url=base_url,
        verify_ssl=payload.verify_ssl if payload.verify_ssl is not None else True,
    )
    return ConnectionTestResponse(
        ok=result.ok,
        provider=result.provider,
        model=result.model,
        latency_ms=result.latency_ms,
        message=result.message,
        sample_response=result.sample_response,
    )


@router.post("", response_model=AgentDetail, status_code=201)
async def create_agent(
    payload: AgentCreate,
    manager: AgentManager = Depends(get_agent_manager)
) -> AgentDetail:
    """Yeni ajan olusturur ve agents.yaml'a yazar."""
    try:
        definition = manager.create_agent(
            name=payload.name,
            role=payload.role,
            description=payload.description,
            provider=payload.provider,
            model=payload.model,
            system_prompt=payload.system_prompt,
            base_url=payload.base_url,
            api_key=payload.api_key,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
            tags=payload.tags,
            is_active=payload.is_active,
            image=payload.image.model_dump() if payload.image else None,
            video=payload.video.model_dump() if payload.video else None,
            audio=payload.audio.model_dump() if payload.audio else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return _def_to_detail(definition)


@router.get("/{agent_id}", response_model=AgentDetail)
async def get_agent(
    agent_id: str,
    manager: AgentManager = Depends(get_agent_manager)
) -> AgentDetail:
    agent = manager.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")
    return _def_to_detail(agent)


@router.patch("/{agent_id}", response_model=AgentDetail)
async def update_agent(
    agent_id: str,
    payload: AgentUpdate,
    manager: AgentManager = Depends(get_agent_manager)
) -> AgentDetail:
    """Ajani kismi gunceller."""
    if not manager.get(agent_id):
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")
    data = payload.model_dump(exclude_unset=True)
    try:
        definition = manager.update_agent(agent_id, **data)
    except KeyError:
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")
    return _def_to_detail(definition)


@router.delete("/{agent_id}", status_code=204)
async def delete_agent(
    agent_id: str,
    manager: AgentManager = Depends(get_agent_manager)
) -> None:
    """Ajani siler."""
    try:
        manager.delete_agent(agent_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")


@router.post("/{agent_id}/duplicate", response_model=AgentDetail, status_code=201)
async def duplicate_agent(
    agent_id: str,
    manager: AgentManager = Depends(get_agent_manager)
) -> AgentDetail:
    """Ajani kopyalar ve yeni id ile kaydeder."""
    try:
        definition = manager.duplicate_agent(agent_id)
    except KeyError:
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")
    return _def_to_detail(definition)


@router.get("/{agent_id}/export")
async def export_agent(
    agent_id: str,
    include_secrets: bool = False,
    manager: AgentManager = Depends(get_agent_manager)
) -> dict:
    """Ajani JSON olarak dondurur. include_secrets=true ise api_key'ler dahil edilir."""
    try:
        return manager.export_agent(agent_id, include_secrets=include_secrets)
    except KeyError:
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")


@router.get("/{agent_id}/conversations", response_model=List[ConversationOut])
async def list_agent_conversations(
    agent_id: str,
    limit: int = 50,
    session: AsyncSession = Depends(get_session),
    manager: AgentManager = Depends(get_agent_manager),
) -> List[ConversationOut]:
    if not manager.get(agent_id):
        raise HTTPException(status_code=404, detail="Ajan bulunamadi")

    stmt = (
        select(
            Conversation.id,
            Conversation.agent_id,
            Conversation.title,
            Conversation.created_at,
            Conversation.updated_at,
            func.count(Message.id).label("message_count"),
        )
        .outerjoin(Message, Message.conversation_id == Conversation.id)
        .where(Conversation.agent_id == agent_id)
        .group_by(Conversation.id)
        .order_by(Conversation.updated_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    rows = result.all()
    return [
        ConversationOut(
            id=r.id,
            agent_id=r.agent_id,
            title=r.title,
            created_at=r.created_at,
            updated_at=r.updated_at,
            message_count=r.message_count,
        )
        for r in rows
    ]