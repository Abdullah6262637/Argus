"""Sohbet is mantigi: agent_loop'u koordine eder, mesajlari DB'ye yazar.

Iki mod:
  - send_message: tek-shot ReAct (eski davranis, /api/chat)
  - send_message_with_plan: TaskPlanner + PlanExecutor (yeni, /api/chat/stream)
"""
from __future__ import annotations

import json
import logging
from typing import AsyncIterator, List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Conversation, Log, LogLevel, Message, MessageRole
from app.services.agent_loop import AgentLoopResult, ToolCallRecord, run_agent_loop
from app.services.agent_manager import agent_manager
from app.services.llm import ChatMessage, LLMError
from app.services.planning import (
    Plan,
    PlanExecutor,
    PlanStatus,
    TaskPlanner,
)
from app.services.planning.executor import PlanEvent
from app.services.planning.reflector import ReflectorService
from app.services.memory.auto_summarize import (
    maybe_summarize,
    search_relevant_memories,
)
from app.websocket import connection_manager

logger = logging.getLogger(__name__)


async def _get_or_create_conversation(
    session: AsyncSession,
    agent_id: str,
    conversation_id: Optional[int],
    first_user_content: str,
) -> Conversation:
    if conversation_id is not None:
        result = await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
        conv = result.scalar_one_or_none()
        if conv is None:
            raise ValueError(f"Sohbet bulunamadi: {conversation_id}")
        if conv.agent_id != agent_id:
            raise ValueError(
                f"Sohbet baska bir ajana ait (conv.agent={conv.agent_id}, istenen={agent_id})"
            )
        return conv

    title = first_user_content.strip().splitlines()[0][:80] or "Yeni Sohbet"
    conv = Conversation(agent_id=agent_id, title=title)
    session.add(conv)
    await session.flush()
    return conv


async def _load_history(
    session: AsyncSession, conversation_id: int, limit: int
) -> List[Message]:
    """Son N mesaji kronolojik olarak getirir."""
    stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc(), Message.id.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    msgs = list(result.scalars().all())
    msgs.reverse()
    return msgs


def _history_to_chat_messages(history: List[Message]) -> List[ChatMessage]:
    """DB Message kayitlarini agent_loop'un bekledigi ChatMessage listesine cevir.
    
    NOT: tool/asistan tool_call'lari simdilik gecmiste tasinmiyor; sadece duz
    user/assistant icerigi tasiniyor. Tool gecmisi tek tur icinde kalir.
    """
    out: List[ChatMessage] = []
    for m in history:
        role = m.role.value if hasattr(m.role, "value") else str(m.role)
        if role in ("user", "assistant"):
            if m.content:
                out.append(ChatMessage(role=role, content=m.content))  # type: ignore[arg-type]
    return out


async def _write_log(
    session: AsyncSession,
    agent_id: str,
    level: LogLevel,
    event: str,
    payload: Optional[dict] = None,
) -> None:
    log = Log(
        agent_id=agent_id,
        level=level,
        event=event,
        payload_json=json.dumps(payload, ensure_ascii=False, default=str) if payload else None,
    )
    session.add(log)


async def send_message(
    session: AsyncSession,
    agent_id: str,
    user_content: str,
    conversation_id: Optional[int] = None,
) -> Tuple[Conversation, Message, Message, AgentLoopResult]:
    """
    Kullanici mesajini agent loop ile isle, son cevabi DB'ye yaz.
    Return: (conversation, user_message, assistant_message, loop_result)
    """
    settings = get_settings()
    agent = agent_manager.require(agent_id)
    if not agent.is_active:
        raise ValueError(f"Ajan aktif degil: {agent_id}")

    # 1) Sohbet
    conv = await _get_or_create_conversation(
        session, agent_id, conversation_id, user_content
    )

    # 2) Kullanici mesajini kaydet
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content=user_content,
    )
    session.add(user_msg)
    await session.flush()

    # 3) Gecmis yukle (yeni user mesaj haric)
    history = await _load_history(session, conv.id, settings.max_history_messages)
    history_wo_new = [m for m in history if m.id != user_msg.id]
    chat_history = _history_to_chat_messages(history_wo_new)

    # 3.5) Sprint 2.2: Long-term memory (vector store'dan gecmis ozetler)
    memory_context = await _build_memory_context(
        agent_id, user_content, exclude_conversation_id=conv.id
    )

    # WS event callback - hem broadcast hem DB log
    async def on_event(event_type: str, payload: dict) -> None:
        # WS broadcast
        try:
            await connection_manager.broadcast({
                "type": event_type,
                "conversation_id": conv.id,
                "agent_id": agent_id,
                **payload})
        except Exception as exc:  # pragma: no cover
            logger.warning("WS broadcast hata: %s", exc)

    # 4) Agent loop calistir
    try:
        loop_result = await run_agent_loop(
            agent,
            chat_history,
            user_content,
            max_steps=8,
            on_event=on_event,
            memory_context=memory_context,
        )
    except LLMError as exc:
        await _write_log(
            session, agent_id, LogLevel.ERROR, "llm_error",
            {"message": str(exc), "conversation_id": conv.id},
        )
        await session.commit()
        raise
    except Exception as exc:  # pragma: no cover
        await _write_log(
            session, agent_id, LogLevel.ERROR, "agent_loop_error",
            {"message": str(exc), "conversation_id": conv.id},
        )
        await session.commit()
        raise LLMError(str(exc)) from exc

    # 5) Tool cagrilarini Log'a yaz
    for tc in loop_result.tool_calls:
        await _write_log(
            session,
            agent_id,
            LogLevel.INFO if tc.ok else LogLevel.WARNING,
            "tool_call",
            {
                "conversation_id": conv.id,
                "tool": tc.name,
                "ok": tc.ok,
                "duration_ms": tc.duration_ms,
                "arguments": tc.arguments,
                "error": tc.error},
        )

    # 6) Asistan mesajini kaydet (tool_calls metadata content sonuna eklenmiyor)
    assistant_content = loop_result.final_content or ""
    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=assistant_content,
        tokens=loop_result.total_tokens or None,
        provider=loop_result.provider,
        model=loop_result.model,
    )
    session.add(assistant_msg)

    await _write_log(
        session,
        agent_id,
        LogLevel.INFO,
        "chat_completed",
        {
            "conversation_id": conv.id,
            "provider": loop_result.provider,
            "model": loop_result.model,
            "total_tokens": loop_result.total_tokens,
            "tool_calls": len(loop_result.tool_calls),
            "steps": loop_result.steps},
    )

    await session.commit()
    await session.refresh(conv)
    await session.refresh(user_msg)
    await session.refresh(assistant_msg)

    # Sprint 2.1: Esik kontrolu - gerekirse konusmayi ozetle (background-friendly)
    try:
        await maybe_summarize(session, conv.id)
        await session.commit()
    except Exception as exc:  # pragma: no cover
        logger.warning("auto-summarize hata: %s", exc)

    return conv, user_msg, assistant_msg, loop_result


# ====================================================================
# Memory yardimcisi (Sprint 2.2)
# ====================================================================

async def _build_memory_context(
    agent_id: str,
    query: str,
    *,
    exclude_conversation_id: Optional[int] = None,
    k: int = 3,
) -> Optional[str]:
    """Vector store'dan ilgili ozetleri al ve LLM'e enjekte edilebilir metne donustur."""
    try:
        results = await search_relevant_memories(
            agent_id, query, k=k, exclude_conversation_id=exclude_conversation_id
        )
    except Exception as exc:  # pragma: no cover
        logger.warning("memory retrieval hata: %s", exc)
        return None
    if not results:
        return None
    lines: List[str] = []
    for i, r in enumerate(results, start=1):
        meta = r.get("metadata") or {}
        title = meta.get("title") or f"konusma_{meta.get('conversation_id', '?')}"
        date = meta.get("created_at", "")
        text = (r.get("text") or "").strip()
        if not text:
            continue
        lines.append(f"[Hatira #{i} | {title} | {date}]\n{text}")
    if not lines:
        return None
    return "\n\n".join(lines)


# ====================================================================
# PLAN-AWARE STREAMING (FAZ 1.4)
# ====================================================================

async def send_message_streaming(
    session: AsyncSession,
    agent_id: str,
    user_content: str,
    conversation_id: Optional[int] = None,
    *,
    use_planning: bool = True,
) -> AsyncIterator[PlanEvent]:
    """Kullanici mesajini plan-aware sekilde isle, event'leri stream et.

    Yield edilen PlanEvent'leri SSE endpoint upstream'e geciri.
    Sonunda DB'ye conversation/message/log yazar.
    """
    settings = get_settings()
    agent = agent_manager.require(agent_id)
    if not agent.is_active:
        raise ValueError(f"Ajan aktif degil: {agent_id}")

    # 1) Conversation
    conv = await _get_or_create_conversation(
        session, agent_id, conversation_id, user_content
    )

    # 2) User mesaji
    user_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.USER,
        content=user_content,
    )
    session.add(user_msg)
    await session.flush()

    # 3) Gecmis
    history = await _load_history(session, conv.id, settings.max_history_messages)
    history_wo_new = [m for m in history if m.id != user_msg.id]
    chat_history = _history_to_chat_messages(history_wo_new)

    # 3.5) Sprint 2.2: Long-term memory injection
    memory_context = await _build_memory_context(
        agent_id, user_content, exclude_conversation_id=conv.id
    )

    # WS callback (paralel olarak ws kanalindan da yayinlayalim)
    async def ws_emit(event_type: str, payload: dict) -> None:
        try:
            await connection_manager.broadcast({
                "type": event_type,
                "conversation_id": conv.id,
                "agent_id": agent_id,
                **payload})
        except Exception as exc:  # pragma: no cover
            logger.warning("WS broadcast hata: %s", exc)

    # 4) Plan olustur
    planner = TaskPlanner(
        max_steps=int(getattr(settings, "plan_max_steps", 7)),
        memory_context=memory_context,
    )
    executor = PlanExecutor(
        retry_limit=int(getattr(settings, "plan_retry_limit", 2)),
        reflector=ReflectorService(
            enabled=bool(getattr(settings, "plan_reflection_enabled", True))
        ),
        planner=planner,
        memory_context=memory_context,
    )

    final_content = ""
    plan_tokens = 0
    plan: Optional[Plan] = None
    all_tool_calls: List[dict] = []

    try:
        if use_planning:
            try:
                plan = await planner.create_plan(
                    user_content,
                    agent,
                    conversation_id=conv.id,
                )
            except LLMError as exc:
                # Planner basarisiz olursa fallback: tek-step plan
                logger.warning("Planner basarisiz, fallback tek step: %s", exc)
                from app.services.planning.models import PlanStep, PlanStatus as _PS

                plan = Plan(
                    goal=user_content,
                    agent_id=agent_id,
                    conversation_id=conv.id,
                    steps=[
                        PlanStep(
                            id=1,
                            title="Hedefi cozumle",
                            description=user_content,
                            expected_output="Net yanit",
                        )
                    ],
                    status=_PS.DRAFT,
                )

            yield PlanEvent("plan_created", {
                "conversation_id": conv.id,
                "plan": plan.to_dict()})
            await ws_emit("plan_created", {"plan": plan.to_dict()})

            # 5) Plan'i calistir
            async for evt in executor.execute_streaming(plan, agent, chat_history):
                # WS broadcast
                await ws_emit(evt.type, {**evt.data, "conversation_id": conv.id})
                # SSE'ye yiel et
                yield evt
                if evt.type == "tool_call_completed":
                    all_tool_calls.append(evt.data)
                elif evt.type in ("plan_completed", "plan_failed"):
                    plan_tokens = evt.data.get("total_tokens", 0)

            final_content = plan.final_summary or "(Plan tamamlandi.)"

        else:
            # Eski tek-shot davranis (planning olmadan)
            loop_result = await run_agent_loop(
                agent, chat_history, user_content,
                max_steps=8,
                on_event=lambda et, p: ws_emit(et, {**p, "conversation_id": conv.id}),
                memory_context=memory_context,
            )
            final_content = loop_result.final_content or ""
            plan_tokens = loop_result.total_tokens or 0
            for tc in loop_result.tool_calls:
                all_tool_calls.append(tc.to_dict())
            yield PlanEvent("plan_completed", {
                "conversation_id": conv.id,
                "final_summary": final_content,
                "total_tool_calls": len(loop_result.tool_calls),
                "total_tokens": plan_tokens})

    except LLMError as exc:
        await _write_log(
            session, agent_id, LogLevel.ERROR, "llm_error",
            {"message": str(exc), "conversation_id": conv.id},
        )
        await session.commit()
        yield PlanEvent("error", {"message": str(exc)})
        return
    except Exception as exc:
        logger.exception("send_message_streaming hata")
        await _write_log(
            session, agent_id, LogLevel.ERROR, "stream_error",
            {"message": str(exc), "conversation_id": conv.id},
        )
        await session.commit()
        yield PlanEvent("error", {"message": str(exc)})
        return

    # 6) Asistan mesajini kaydet
    assistant_msg = Message(
        conversation_id=conv.id,
        role=MessageRole.ASSISTANT,
        content=final_content,
        tokens=plan_tokens or None,
        provider=agent.provider,
        model=agent.model,
    )
    session.add(assistant_msg)

    # 7) Tool call'lari ve plan'i log'a yaz
    for tc in all_tool_calls:
        await _write_log(
            session,
            agent_id,
            LogLevel.INFO if tc.get("ok", True) else LogLevel.WARNING,
            "tool_call",
            {
                "conversation_id": conv.id,
                "tool": tc.get("name"),
                "ok": tc.get("ok"),
                "duration_ms": tc.get("duration_ms"),
                "arguments": tc.get("arguments"),
                "error": tc.get("error")},
        )

    if plan:
        await _write_log(
            session, agent_id, LogLevel.INFO, "plan_executed",
            {
                "conversation_id": conv.id,
                "plan_id": plan.id,
                "status": plan.status.value if hasattr(plan.status, 'value') else str(plan.status),
                "steps": len(plan.steps),
                "tool_calls": len(all_tool_calls)},
        )

        # Plan'i DB'ye kaydet (PlanRecord)
        try:
            from app.models.plan import PlanRecord

            plan_rec = PlanRecord(
                id=plan.id,
                agent_id=agent_id,
                conversation_id=conv.id,
                goal=plan.goal,
                status=plan.status.value if hasattr(plan.status, 'value') else str(plan.status),
                steps_json=json.dumps(
                    [s.to_dict() for s in plan.steps], ensure_ascii=False, default=str
                ),
                final_summary=plan.final_summary,
                error=plan.error,
                metadata_json=json.dumps(plan.metadata, ensure_ascii=False, default=str)
                if plan.metadata
                else None,
                completed_at=plan.completed_at,
            )
            session.add(plan_rec)
        except Exception as exc:  # pragma: no cover
            logger.warning("PlanRecord kaydedilemedi: %s", exc)

    await session.commit()
    await session.refresh(assistant_msg)

    # Sprint 2.1: Esik kontrolu - gerekirse konusmayi ozetle
    try:
        await maybe_summarize(session, conv.id)
        await session.commit()
    except Exception as exc:  # pragma: no cover
        logger.warning("auto-summarize hata (stream): %s", exc)

    # Final mesaj event'i (UI'nin DB row id'sini ogrenmesi icin)
    yield PlanEvent("message_saved", {
        "conversation_id": conv.id,
        "assistant_message_id": assistant_msg.id,
        "user_message_id": user_msg.id,
        "content": final_content,
        "tokens": assistant_msg.tokens,
        "provider": assistant_msg.provider,
        "model": assistant_msg.model})