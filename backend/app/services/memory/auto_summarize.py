"""Otomatik konusma ozeti + embed (Sprint 2.1).

Bir konusma belirli bir esige ulastiginda (mesaj sayisi veya idle sure):
  1. Son N mesaji LLM ile kisaca ozetle (~200 token)
  2. Ozeti embed et
  3. Vector store'a {agent_id, conv_id, date} metadata'siyla upsert et

Boylece ileride ayni ajan ile yeni bir konusma baslatilirsa, vector_search
icin secilebilir bir memory havuzu olusur (Sprint 2.2 ile injection yapilir).
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message
from app.services.agent_manager import agent_manager
from app.services.llm import ChatMessage, get_provider, LLMError
from app.services.memory.embedding import embedding_service
from app.services.memory.vector_store import vector_store

logger = logging.getLogger(__name__)


# Bir konusma icin ozet uretilmesi icin minimum mesaj sayisi
MIN_MESSAGES_FOR_SUMMARY = 4
# Eger son ozet bu kadar mesaj geride kaldiysa yeni ozet uretilir
RESUMMARIZE_AFTER_N_NEW_MESSAGES = 6


SUMMARY_SYSTEM_PROMPT = (
    "Asagida bir kullanici-agent konusmasi var. Bu konusmanin OZUNU 3-5 cumlede "
    "Turkce olarak ozetle. Sadece bilgi-yogun, ileride hatirlanmasi degerli noktalara "
    "odaklan. Sus pus konusmalari, selamlasma, tesekkur gibi yapisi ozetin disinda birak.\n\n"
    "FORMAT:\n"
    "- Bir paragraf, 200 tokeni gecmesin\n"
    "- 3. sahis ('Kullanici X istedi', 'Ajan Y yapti')\n"
    "- Ana baslik, anahtar isimler, kararlar, dosya yollari, link/url'ler korunsun\n"
    "- Ipucu mahiyetinde anahtar kelimeleri PARANTEZ icinde liste olarak ekle (3-7 adet)"
)


async def _load_messages(session: AsyncSession, conversation_id: int) -> List[Message]:
    result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    return list(result.scalars().all())


def _format_for_llm(messages: List[Message]) -> str:
    """Mesaj geçmişini LLM'in özetleyebileceği düz metne çevir."""
    out: List[str] = []
    for m in messages:
        role = m.role.value if hasattr(m.role, "value") else str(m.role)
        # Tool/system mesajlari dahil etme - sadece user/assistant
        if role not in ("user", "assistant"):
            continue
        prefix = "Kullanici" if role == "user" else "Ajan"
        content = (m.content or "").strip()
        if not content:
            continue
        # Cok uzun mesajlari kirp
        if len(content) > 800:
            content = content[:800] + "..."
        out.append(f"{prefix}: {content}")
    return "\n\n".join(out)


async def summarize_and_index(
    session: AsyncSession,
    conversation_id: int,
    *,
    force: bool = False,
) -> Optional[str]:
    """Bir konusmayi ozetle ve vector store'a yaz.

    Args:
        session: DB session
        conversation_id: hedef konusma
        force: True ise mesaj sayisina bakma, daima ozet uret

    Returns:
        Uretilen ozet metni (basarisizsa None)
    """
    conv: Optional[Conversation] = (
        await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
    ).scalar_one_or_none()
    if conv is None:
        logger.warning("summarize: conversation %s yok", conversation_id)
        return None

    messages = await _load_messages(session, conversation_id)
    if not force and len(messages) < MIN_MESSAGES_FOR_SUMMARY:
        return None

    transcript = _format_for_llm(messages)
    if not transcript.strip():
        return None

    # Agent'i yukle (LLM cagrisi icin)
    try:
        agent = agent_manager.require(conv.agent_id)
    except KeyError:
        logger.warning("summarize: agent %s yok, atlandi", conv.agent_id)
        return None

    try:
        provider = get_provider(
            agent.provider,
            agent.model,
            api_key=agent.api_key,
            base_url=agent.base_url,
        )
        response = await provider.chat(
            messages=[
                ChatMessage(role="system", content=SUMMARY_SYSTEM_PROMPT),
                ChatMessage(role="user", content=transcript)],
            temperature=0.3,
            max_tokens=350,
            tools=None,
        )
        summary = (response.content or "").strip()
    except LLMError as exc:
        logger.warning("summarize: LLM hata - %s", exc)
        return None
    except Exception as exc:  # pragma: no cover
        logger.exception("summarize: beklenmedik hata: %s", exc)
        return None

    if not summary:
        return None

    # Embed + upsert
    try:
        vector = await embedding_service.embed_one(summary)
        if not vector:
            return summary  # vector store kullanilamazsa ozet yine uretildi
        if not vector_store.available:
            logger.info("vector_store kullanilamiyor, ozet sadece DB'ye yazilmadi")
            return summary

        meta = {
            "type": "conversation_summary",
            "conversation_id": conversation_id,
            "agent_id": conv.agent_id,
            "title": conv.title or "",
            "message_count": len(messages),
            "created_at": datetime.now(timezone.utc).isoformat()}
        # Deterministik id: ayni konusma yeniden ozetlenirse upsert
        det_id = f"summary_conv_{conversation_id}"
        vector_store.upsert(
            texts=[summary],
            embeddings=[vector],
            metadatas=[meta],
            ids=[det_id],
            agent_id=conv.agent_id,
        )
        logger.info(
            "Konusma %s ozetlendi (%d mesaj -> %d karakter)",
            conversation_id, len(messages), len(summary),
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("summarize: vector store yazma hata: %s", exc)

    return summary


async def maybe_summarize(
    session: AsyncSession,
    conversation_id: int,
) -> Optional[str]:
    """Esik kontrolu yapar; gerekiyorsa ozet uretir.

    Cagiran (chat_service) her mesajdan sonra cagirir; gerekirse ozet uretilir.
    """
    messages = await _load_messages(session, conversation_id)
    n = len(messages)
    if n < MIN_MESSAGES_FOR_SUMMARY:
        return None
    # Her N mesajda bir ozet uret/yenile
    if n % RESUMMARIZE_AFTER_N_NEW_MESSAGES != 0:
        return None
    return await summarize_and_index(session, conversation_id, force=True)


async def search_relevant_memories(
    agent_id: str,
    query: str,
    *,
    k: int = 3,
    exclude_conversation_id: Optional[int] = None,
) -> List[dict]:
    """Vector store'da `query`'e en yakin gecmis konusma ozetlerini ara.

    `exclude_conversation_id` varsa o konusmanin kendi ozetini disla
    (yeni mesaja eklenince henuz icermez ama arada kosulan ozet olabilir).
    """
    if not vector_store.available:
        return []
    try:
        vec = await embedding_service.embed_one(query)
        if not vec:
            return []
        results = vector_store.query(
            embedding=vec,
            k=k + (1 if exclude_conversation_id else 0),
            agent_id=agent_id,
            where={"type": "conversation_summary"},
        )
        if exclude_conversation_id is not None:
            results = [
                r for r in results
                if (r.get("metadata") or {}).get("conversation_id") != exclude_conversation_id
            ]
        return results[:k]
    except Exception as exc:  # pragma: no cover
        logger.warning("search_relevant_memories hata: %s", exc)
        return []