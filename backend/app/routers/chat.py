"""/api/chat router'i - tool calling + SSE streaming destekli."""
from __future__ import annotations

import asyncio
import json
import logging
from typing import List, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import PlainTextResponse, Response, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, get_session
from app.models import Conversation, Message, MessageFeedback, FeedbackRating
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationDetail,
    MessageOut,
    ToolCallOut,
)
from app.services.chat_service import send_message, send_message_streaming
from app.services.llm import LLMError
from app.services.streaming import sse_format
from app.websocket import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _to_message_out(m: Message) -> MessageOut:
    role = m.role.value if hasattr(m.role, "value") else str(m.role)
    return MessageOut(
        id=m.id,
        conversation_id=m.conversation_id,
        role=role,
        content=m.content,
        tokens=m.tokens,
        provider=m.provider,
        model=m.model,
        created_at=m.created_at,
    )


@router.post("", response_model=ChatResponse)
async def post_message(
    payload: ChatRequest,
    session: AsyncSession = Depends(get_session),
) -> ChatResponse:
    try:
        conv, user_msg, assistant_msg, loop_result = await send_message(
            session,
            payload.agent_id,
            payload.content,
            payload.conversation_id,
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=f"LLM hatasi: {exc}")

    user_out = _to_message_out(user_msg)
    assistant_out = _to_message_out(assistant_msg)

    tool_calls_out: List[ToolCallOut] = [
        ToolCallOut(
            id=tc.id,
            name=tc.name,
            arguments=tc.arguments,
            ok=tc.ok,
            output=tc.output,
            error=tc.error,
            data=tc.data,
            duration_ms=tc.duration_ms,
        )
        for tc in loop_result.tool_calls
    ]

    # WS final mesaj yayini
    await connection_manager.broadcast(
        {
            "type": "message",
            "conversation_id": conv.id,
            "agent_id": conv.agent_id,
            "user": user_out.model_dump(mode="json"),
            "assistant": assistant_out.model_dump(mode="json"),
            "tool_calls": [tc.model_dump(mode="json") for tc in tool_calls_out],
            "steps": loop_result.steps}
    )

    return ChatResponse(
        conversation_id=conv.id,
        user_message=user_out,
        assistant_message=assistant_out,
        tool_calls=tool_calls_out,
        steps=loop_result.steps,
    )


@router.get("/{conversation_id}", response_model=ConversationDetail)
async def get_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
) -> ConversationDetail:
    conv = (
        await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
    ).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadi")

    msgs_result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    msgs = list(msgs_result.scalars().all())

    return ConversationDetail(
        id=conv.id,
        agent_id=conv.agent_id,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        message_count=len(msgs),
        messages=[_to_message_out(m) for m in msgs],
    )


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: int,
    session: AsyncSession = Depends(get_session),
) -> None:
    conv = (
        await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
    ).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadi")
    await session.delete(conv)
    await session.commit()


# ============================================================
# Sprint E.5: Konusma export (Markdown / JSON)
# ============================================================


@router.get("/{conversation_id}/export")
async def export_conversation(
    conversation_id: int,
    format: Literal["md", "json"] = Query("md", description="md = Markdown, json = JSON"),
    session: AsyncSession = Depends(get_session),
):
    """Sohbeti Markdown veya JSON olarak indir."""
    conv = (
        await session.execute(
            select(Conversation).where(Conversation.id == conversation_id)
        )
    ).scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Sohbet bulunamadi")

    msgs_result = await session.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
    )
    msgs = list(msgs_result.scalars().all())

    fname_base = f"conversation_{conv.id}_{(conv.title or 'untitled').replace(' ', '_')[:40]}"

    if format == "json":
        payload = {
            "id": conv.id,
            "agent_id": conv.agent_id,
            "title": conv.title,
            "created_at": conv.created_at.isoformat() if conv.created_at else None,
            "updated_at": conv.updated_at.isoformat() if conv.updated_at else None,
            "messages": [
                {
                    "id": m.id,
                    "role": m.role.value if hasattr(m.role, "value") else str(m.role),
                    "content": m.content,
                    "tokens": m.tokens,
                    "provider": m.provider,
                    "model": m.model,
                    "created_at": m.created_at.isoformat() if m.created_at else None}
                for m in msgs
            ]}
        return Response(
            content=json.dumps(payload, ensure_ascii=False, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{fname_base}.json"'},
        )

    # Markdown
    lines: List[str] = []
    lines.append(f"# {conv.title or 'Konusma'}\n")
    lines.append(f"- **Ajan:** `{conv.agent_id}`")
    if conv.created_at:
        lines.append(f"- **Tarih:** {conv.created_at.strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"- **Mesaj sayisi:** {len(msgs)}\n")
    lines.append("---\n")
    for m in msgs:
        role = m.role.value if hasattr(m.role, "value") else str(m.role)
        ts = m.created_at.strftime("%H:%M:%S") if m.created_at else ""
        if role == "user":
            header = f"### 👤 Kullanici · {ts}"
        elif role == "assistant":
            header = f"### 🤖 Asistan · {ts}"
        elif role == "tool":
            header = f"### 🔧 Tool · {ts}"
        else:
            header = f"### {role} · {ts}"
        lines.append(header)
        lines.append("")
        lines.append(m.content or "")
        lines.append("")

    md = "\n".join(lines)
    return PlainTextResponse(
        content=md,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{fname_base}.md"'},
    )


# ============================================================
# Sprint E.5: Mesaj reaksiyon (👍 / 👎)
# ============================================================


@router.post("/messages/{message_id}/feedback", status_code=201)
async def add_message_feedback(
    message_id: int,
    payload: dict,
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Bir mesaja 👍/👎 reaksiyonu ekle. Body: {rating: 'up'|'down', comment?: str}."""
    rating_raw = (payload.get("rating") or "").lower().strip()
    if rating_raw not in ("up", "down"):
        raise HTTPException(400, "rating yalnizca 'up' veya 'down' olabilir")

    comment = payload.get("comment")

    # Mesaj var mi?
    msg = (
        await session.execute(select(Message).where(Message.id == message_id))
    ).scalar_one_or_none()
    if not msg:
        raise HTTPException(404, "Mesaj bulunamadi")

    fb = MessageFeedback(
        message_id=message_id,
        rating=FeedbackRating(rating_raw),
        comment=comment,
    )
    session.add(fb)
    await session.commit()
    await session.refresh(fb)
    return {
        "id": fb.id,
        "message_id": fb.message_id,
        "rating": fb.rating.value,
        "comment": fb.comment,
        "created_at": fb.created_at.isoformat() if fb.created_at else None}


# ============================================================
# SSE Streaming endpoint - plan-aware (FAZ 1.4)
# ============================================================

@router.post("/stream")
async def post_message_stream(payload: ChatRequest, request: Request):
    """Plan + step + tool event'lerini SSE ile yayinla.

    Her bir StreamingResponse kendi DB session'ini acar (Depends kullanmiyoruz
    cunku async generator yasam dongusu farkli).
    """

    async def event_generator():
        # Baslangic comment - bazi proxy'ler ilk byte gelmeden timeout yapiyor
        yield ": ping\n\n"

        async with AsyncSessionLocal() as session:
            try:
                async for evt in send_message_streaming(
                    session,
                    payload.agent_id,
                    payload.content,
                    payload.conversation_id,
                    use_planning=True,
                ):
                    if await request.is_disconnected():
                        logger.info("SSE client disconnected, plan iptal")
                        break
                    yield sse_format(evt.type, evt.data)
            except KeyError as exc:
                yield sse_format("error", {"message": str(exc), "code": "agent_not_found"})
            except ValueError as exc:
                yield sse_format("error", {"message": str(exc), "code": "invalid_request"})
            except LLMError as exc:
                yield sse_format("error", {"message": f"LLM hatasi: {exc}", "code": "llm_error"})
            except Exception as exc:
                logger.exception("SSE stream hatasi")
                yield sse_format("error", {"message": str(exc), "code": "internal_error"})
            finally:
                yield sse_format("done", {})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # nginx buffering kapali
            "Connection": "keep-alive"},
    )