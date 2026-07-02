"""Sprint B.1: ApprovalService HITL flow testleri."""
from __future__ import annotations

import asyncio

import pytest

from app.services.approval_service import (
    ApprovalService,
    classify_risk,
    requires_approval,
)


class TestRiskClassification:
    def test_run_command_is_high_risk(self):
        assert classify_risk("run_command", {"command": "ls"}) == "high"

    def test_dangerous_command_is_high_risk(self):
        assert classify_risk("run_command", {"command": "rm -rf /"}) == "high"

    def test_kill_process_is_high_risk(self):
        assert classify_risk("kill_process", {"pid": 1}) == "high"

    def test_shutdown_is_high_risk(self):
        assert classify_risk("shutdown", {}) == "high"

    def test_delete_file_is_high_risk(self):
        assert classify_risk("delete_file", {"path": "/tmp/x"}) == "high"

    def test_write_file_is_medium_risk(self):
        assert classify_risk("write_file", {"path": "/tmp/x"}) == "medium"

    def test_append_file_is_medium_risk(self):
        assert classify_risk("append_file", {"path": "/tmp/x"}) == "medium"

    def test_read_file_is_low_risk(self):
        assert classify_risk("read_file", {"path": "/tmp/x"}) == "low"

    def test_web_search_is_low_risk(self):
        assert classify_risk("web_search", {"query": "test"}) == "low"

    def test_unknown_tool_is_low_risk(self):
        assert classify_risk("custom_random_tool", {}) == "low"


class TestRequiresApproval:
    def test_high_risk_requires(self):
        assert requires_approval("run_command", {"command": "ls"}) is True
        assert requires_approval("kill_process", {"pid": 1}) is True

    def test_medium_risk_no_approval(self):
        assert requires_approval("write_file", {"path": "/x"}) is False

    def test_low_risk_no_approval(self):
        assert requires_approval("read_file", {"path": "/x"}) is False
        assert requires_approval("web_search", {"query": "x"}) is False


@pytest.mark.asyncio
class TestApprovalServiceFlow:
    async def test_decide_approve(self):
        """Onay verildiginde request_approval True donmeli."""
        service = ApprovalService(default_timeout=5.0)

        async def approver(approval_id_holder: list):
            await asyncio.sleep(0.1)
            # ID'yi bekleyen waiter'larin son anahtariyla bul
            await asyncio.sleep(0.05)
            ids = list(service._waiters.keys())
            if ids:
                approval_id_holder.append(ids[-1])
                await service.decide(ids[-1], approved=True, reason="ok")

        ids: list = []
        # Eszamanli istek + karar
        approve_task = asyncio.create_task(approver(ids))
        ok, reason = await service.request_approval(
            agent_id="test",
            tool_name="run_command",
            arguments={"command": "ls"},
        )
        await approve_task
        assert ok is True
        assert "ok" in reason

    async def test_decide_reject(self):
        service = ApprovalService(default_timeout=5.0)

        async def rejector():
            await asyncio.sleep(0.1)
            ids = list(service._waiters.keys())
            if ids:
                await service.decide(ids[-1], approved=False, reason="no")

        reject_task = asyncio.create_task(rejector())
        ok, reason = await service.request_approval(
            agent_id="test",
            tool_name="run_command",
            arguments={"command": "rm -rf /"},
        )
        await reject_task
        assert ok is False
        assert "no" in reason

    async def test_timeout_returns_false(self):
        """Cok kisa bir timeout ile karar verilmezse False donmeli."""
        service = ApprovalService(default_timeout=0.2)
        ok, reason = await service.request_approval(
            agent_id="test",
            tool_name="run_command",
            arguments={"command": "echo"},
        )
        assert ok is False
        assert "timeout" in reason.lower() or "zaman" in reason.lower()

    async def test_decide_unknown_id_returns_false(self):
        service = ApprovalService()
        result = await service.decide(approval_id=99999, approved=True)
        assert result is False

    async def test_decide_approve_with_modified_arguments(self):
        """Onay verirken parametreler degistirilirse, orijinal dict in-place guncellenmeli."""
        service = ApprovalService(default_timeout=5.0)

        async def approver():
            await asyncio.sleep(0.1)
            ids = list(service._waiters.keys())
            if ids:
                await service.decide(
                    ids[-1],
                    approved=True,
                    reason="command edited",
                    modified_arguments={"command": "echo modified"},
                )

        args = {"command": "echo original"}
        approve_task = asyncio.create_task(approver())
        ok, reason = await service.request_approval(
            agent_id="test",
            tool_name="run_command",
            arguments=args,
        )
        await approve_task
        assert ok is True
        assert args["command"] == "echo modified"