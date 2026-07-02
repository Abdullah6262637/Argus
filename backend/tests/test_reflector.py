"""Sprint B.1: ReflectorService karar testleri (PASS / RETRY / REPLAN / FAIL)."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.services.agent_manager import AgentDefinition
from app.services.planning.models import Plan, PlanStep
from app.services.planning.reflector import (
    ReflectionVerdict,
    ReflectorService,
)


def _agent() -> AgentDefinition:
    return AgentDefinition(  # type: ignore[call-arg]
        id="t",
        name="T",
        role="",
        provider="openai",
        model="gpt-4o-mini",
    )


def _plan_step() -> tuple[Plan, PlanStep]:
    step = PlanStep(  # type: ignore[call-arg]
        id=1, title="Do", description="d", expected_output="ok",
    )
    plan = Plan(goal="g", agent_id="t", steps=[step])
    return plan, step


class _FakeResp:
    def __init__(self, content: str):
        self.content = content
        self.tool_calls = None
        self.usage = None


class TestReflectorParseDecision:
    def test_parse_pass(self):
        r = ReflectorService()
        d = r._parse_decision('{"verdict": "pass", "reason": "iyi"}')
        assert d.verdict == ReflectionVerdict.PASS
        assert d.reason == "iyi"

    def test_parse_retry(self):
        r = ReflectorService()
        d = r._parse_decision('{"verdict": "retry", "reason": "kucuk hata", "suggested_fix": "tekrar dene"}')
        assert d.verdict == ReflectionVerdict.RETRY
        assert d.suggested_fix == "tekrar dene"

    def test_parse_replan(self):
        r = ReflectorService()
        d = r._parse_decision('{"verdict": "replan", "reason": "yanlis yol"}')
        assert d.verdict == ReflectionVerdict.REPLAN

    def test_parse_fail(self):
        r = ReflectorService()
        d = r._parse_decision('{"verdict": "fail", "reason": "iflas"}')
        assert d.verdict == ReflectionVerdict.FAIL

    def test_parse_invalid_verdict_falls_back_pass(self):
        r = ReflectorService()
        d = r._parse_decision('{"verdict": "weird-string", "reason": "x"}')
        assert d.verdict == ReflectionVerdict.PASS

    def test_parse_markdown_codeblock(self):
        r = ReflectorService()
        d = r._parse_decision('```json\n{"verdict": "pass", "reason": "x"}\n```')
        assert d.verdict == ReflectionVerdict.PASS

    def test_parse_text_fallback_fail(self):
        r = ReflectorService()
        d = r._parse_decision("Bu adim kesin fail durumunda")
        assert d.verdict == ReflectionVerdict.FAIL

    def test_parse_text_fallback_retry(self):
        r = ReflectorService()
        d = r._parse_decision("Bence retry et")
        assert d.verdict == ReflectionVerdict.RETRY

    def test_parse_text_fallback_replan(self):
        r = ReflectorService()
        d = r._parse_decision("This is a replan situation")
        assert d.verdict == ReflectionVerdict.REPLAN

    def test_parse_empty_returns_pass(self):
        r = ReflectorService()
        d = r._parse_decision("")
        assert d.verdict == ReflectionVerdict.PASS


@pytest.mark.asyncio
class TestReflectorEvaluate:
    async def test_disabled_returns_pass(self):
        r = ReflectorService(enabled=False)
        plan, step = _plan_step()
        decision = await r.evaluate(plan, step, _agent(), "some content", [])
        assert decision.verdict == ReflectionVerdict.PASS

    async def test_enabled_calls_llm(self):
        r = ReflectorService(enabled=True)
        plan, step = _plan_step()

        fake_provider = AsyncMock()
        fake_provider.chat = AsyncMock(return_value=_FakeResp(
            '{"verdict": "pass", "reason": "tamam"}'
        ))

        with patch(
            "app.services.planning.reflector.get_provider",
            return_value=fake_provider,
        ):
            decision = await r.evaluate(plan, step, _agent(), "result text", [])

        assert decision.verdict == ReflectionVerdict.PASS
        fake_provider.chat.assert_awaited_once()

    async def test_llm_error_falls_back_pass(self):
        r = ReflectorService(enabled=True)
        plan, step = _plan_step()

        fake_provider = AsyncMock()
        fake_provider.chat = AsyncMock(side_effect=RuntimeError("network down"))

        with patch(
            "app.services.planning.reflector.get_provider",
            return_value=fake_provider,
        ):
            decision = await r.evaluate(plan, step, _agent(), "x", [])

        assert decision.verdict == ReflectionVerdict.PASS
        assert "hata" in decision.reason.lower() or "fail" not in decision.reason.lower()