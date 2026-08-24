"""ApprovalService: HITL onay kuyrugu.

Akis:
  1. Tool execute oncesi tool_registry, gerekli ise create_approval cagirir
  2. Kayit DB'ye yazilir, WS uzerinden 'approval_required' yayinlanir
  3. Servis decision'i bekler (asyncio.Event)
  4. /api/approvals/{id}/(approve|reject) endpoint'i Event.set() yapar
  5. Servis sonucu doner

Risk classifier:
  Tehlikeli tool isimleri ve patternleri tanir (run_command rm/format/etc)
"""
from __future__ import annotations

import asyncio
import json
import logging
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any, Dict, Optional

from sqlalchemy import select

from app.database import session_scope
from app.models.approval import PendingApproval
from app.websocket import connection_manager

logger = logging.getLogger(__name__)


# Tool ismi -> risk seviyesi (yuksek = onay zorunlu)
HIGH_RISK_TOOLS = {
    "run_command",
    "kill_process",
    "shutdown",
    "delete_file",
    "lock_screen",
    "set_volume",
    # Sprint D.6 — DevOps yikici islemler
    "docker_run",
    "docker_build",
    "kubectl_apply",
    # Sprint D.7 — Aktif tarama
    "port_scan",
    # Ajan onay bekleme
    "agent_wait_for_approval"}

MEDIUM_RISK_TOOLS = {
    "write_file",
    "append_file",
    "move_file",
    "unzip",
    "mkdir"}

# run_command icin tehlikeli komut pattern'leri
DANGEROUS_CMD_PATTERNS = [
    re.compile(r"\brm\s+-rf?\b", re.IGNORECASE),
    re.compile(r"\bdel\s+/[sf]\b", re.IGNORECASE),
    re.compile(r"\bformat\s+[a-z]:", re.IGNORECASE),
    re.compile(r"\bdd\s+if=", re.IGNORECASE),
    re.compile(r"\bmkfs\.", re.IGNORECASE),
    re.compile(r":\(\)\{.*\}\;\:", re.IGNORECASE),  # fork bomb
    re.compile(r"\bshutdown\b", re.IGNORECASE),
    re.compile(r"\bregistry\s+delete\b", re.IGNORECASE),
    re.compile(r"reg\s+delete", re.IGNORECASE)]


@dataclass
class _PendingFuture:
    event: asyncio.Event = field(default_factory=asyncio.Event)
    decision: Optional[str] = None  # 'approved' | 'rejected'
    reason: Optional[str] = None
    modified_arguments: Optional[Dict[str, Any]] = None


def classify_risk(tool_name: str, args: Dict[str, Any]) -> str:
    """Tool + argumana gore risk seviyesi: low | medium | high."""
    if tool_name in HIGH_RISK_TOOLS:
        # run_command icin ekstra: tehlikeli pattern varsa kesin high
        if tool_name == "run_command":
            cmd = str(args.get("command", "")) + " " + str(args.get("cmd", ""))
            for pat in DANGEROUS_CMD_PATTERNS:
                if pat.search(cmd):
                    return "high"
            return "high"  # her run_command default high
        return "high"
    if tool_name in MEDIUM_RISK_TOOLS:
        return "medium"
    return "low"


def requires_approval(tool_name: str, args: Dict[str, Any]) -> bool:
    """Bu tool cagrisi icin kullanici onayi gerek mi?
    
    Default: high risk -> True, medium -> False (sadece log), low -> False.
    """
    risk = classify_risk(tool_name, args)
    return risk == "high"


class ApprovalService:
    def __init__(self, *, default_timeout: float = 300.0) -> None:
        self.default_timeout = default_timeout
        self._waiters: Dict[int, _PendingFuture] = {}
        self._lock = asyncio.Lock()

    async def request_approval(
        self,
        *,
        agent_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        conversation_id: Optional[int] = None,
        plan_id: Optional[str] = None,
        step_id: Optional[int] = None,
        timeout: Optional[float] = None,
    ) -> tuple[bool, str]:
        """Onay iste. Return: (onaylandi_mi, reason)."""
        timeout = timeout or self.default_timeout
        risk = classify_risk(tool_name, arguments)

        # DB'ye kayit at
        async with session_scope() as session:
            approval = PendingApproval(
                agent_id=agent_id,
                conversation_id=conversation_id,
                plan_id=plan_id,
                step_id=step_id,
                tool_name=tool_name,
                arguments_json=json.dumps(arguments, ensure_ascii=False, default=str),
                risk_level=risk,
                status="pending",
            )
            session.add(approval)
            await session.flush()
            approval_id = approval.id

        # Waiter kaydi
        future = _PendingFuture()
        async with self._lock:
            self._waiters[approval_id] = future

        # WS broadcast
        try:
            await connection_manager.broadcast({
                "type": "approval_required",
                "approval_id": approval_id,
                "agent_id": agent_id,
                "conversation_id": conversation_id,
                "tool_name": tool_name,
                "arguments": arguments,
                "risk_level": risk,
                "plan_id": plan_id,
                "step_id": step_id})
        except Exception as exc:
            logger.warning("WS approval broadcast hata: %s", exc)

        # Bekle
        try:
            await asyncio.wait_for(future.event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            # Timeout: otomatik reject
            await self._mark_decision(approval_id, "timeout", "zaman asimi")
            async with self._lock:
                self._waiters.pop(approval_id, None)
            return False, "Onay icin zaman asimi (timeout)"

        async with self._lock:
            self._waiters.pop(approval_id, None)

        if future.decision == "approved":
            if future.modified_arguments is not None:
                arguments.clear()
                arguments.update(future.modified_arguments)
            return True, future.reason or "onaylandi"
        return False, future.reason or "reddedildi"

    async def decide(
        self,
        approval_id: int,
        approved: bool,
        reason: Optional[str] = None,
        decided_by: Optional[str] = None,
        modified_arguments: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """API'den gelen karari isle. Return: bulundu_mu."""
        decision = "approved" if approved else "rejected"
        ok = await self._mark_decision(approval_id, decision, reason, decided_by, modified_arguments)
        if not ok:
            return False

        async with self._lock:
            future = self._waiters.get(approval_id)

        if future:
            future.decision = decision
            future.reason = reason
            future.modified_arguments = modified_arguments
            future.event.set()

        # WS notify
        try:
            await connection_manager.broadcast({
                "type": "approval_decided",
                "approval_id": approval_id,
                "status": decision,
                "reason": reason})
        except Exception as exc:
            logger.warning("WS approval_decided hata: %s", exc)

        return True

    async def _mark_decision(
        self,
        approval_id: int,
        status: str,
        reason: Optional[str],
        decided_by: Optional[str] = None,
        modified_arguments: Optional[Dict[str, Any]] = None,
    ) -> bool:
        async with session_scope() as session:
            result = await session.execute(
                select(PendingApproval).where(PendingApproval.id == approval_id)
            )
            approval = result.scalar_one_or_none()
            if not approval:
                return False
            if approval.status != "pending":
                # Zaten karar verilmis
                return True
            approval.status = status
            approval.reason = reason
            approval.decided_by = decided_by
            approval.decided_at = datetime.now(UTC)
            if modified_arguments is not None:
                approval.arguments_json = json.dumps(modified_arguments, ensure_ascii=False, default=str)
        return True


# Singleton
approval_service = ApprovalService()