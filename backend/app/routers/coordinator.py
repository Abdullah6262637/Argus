"""Sprint F.1: /api/coordinator router'i.

Endpoint:
  POST /api/coordinator/route — Kullanici mesajini analiz et, hangi ajana
                                yonlendirilmeli oldugunu dondur.

Bu endpoint chat baslatmaz; sadece **karar** verir. Frontend bunu kullanip
kullaniciya "Bu istek X ajanina daha uygun" gibi oneri gosterebilir veya
otomatik olarak `/api/chat` cagirabilir.
"""
from __future__ import annotations

from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.coordinator import CoordinatorDecision, coordinator_service

router = APIRouter(prefix="/api/coordinator", tags=["coordinator"])


class RouteRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=10000)
    coordinator_agent_id: Optional[str] = None


class RouteResponse(BaseModel):
    primary: str           # 'self' veya agent_id
    chain: List[str]
    reason: str
    self_handled: bool


@router.post("/route", response_model=RouteResponse)
async def route(payload: RouteRequest) -> RouteResponse:
    """Kullanici mesajini analiz et ve hangi ajana yonlendirilmesi gerektigini doner."""
    if payload.coordinator_agent_id:
        coordinator_service.coordinator_agent_id = payload.coordinator_agent_id

    try:
        decision: CoordinatorDecision = await coordinator_service.classify(payload.message)
    except Exception as exc:  # pragma: no cover
        raise HTTPException(500, f"Coordinator hata: {exc}")

    return RouteResponse(
        primary=decision.primary,
        chain=decision.chain,
        reason=decision.reason,
        self_handled=decision.self_handled,
    )