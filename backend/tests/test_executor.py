"""Sprint B.1: PlanExecutor step orchestration testleri."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.services.agent_loop import AgentLoopResult
from app.services.agent_manager import AgentDefinition
from app.services.planning.executor import PlanExecutor, PlanEvent
from app.services.planning.models import Plan, PlanStatus, PlanStep, StepStatus
from app.services.planning.reflector import (
    ReflectionDecision,
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


def _plan(num_steps: int = 2) -> Plan:
    steps = [
        PlanStep(  # type: ignore[call-arg]
            id=i + 1,
            title=f"S{i + 1}",
            description=f"do {i + 1}",
            expected_output="",
        )
        for i in range(num_steps)
    ]
    return Plan(goal="Test goal", agent_id="t", steps=steps)


def _loop_result(content: str = "ok") -> AgentLoopResult:
    return AgentLoopResult(final_content=content, tool_calls=[], steps=1)


class TestExecutorPromptBuild:
    def test_build_step_prompt_includes_goal_and_step(self):
        ex = PlanExecutor()
        plan = _plan()
        prompt = ex._build_step_prompt(plan, plan.steps[0], [])
        assert "Test goal" in prompt
        assert "S1" in prompt
        assert "do 1" in prompt

    def test_build_step_prompt_with_context(self):
        ex = PlanExecutor()
        plan = _plan()
        prompt = ex._build_step_prompt(
            plan,
            plan.steps[1],
            ["[Adim #1 - S1]\nResult of step 1"],
        )
        assert "Result of step 1" in prompt

    def test_build_step_prompt_with_expected_and_hints(self):
        ex = PlanExecutor()
        plan = _plan()
        plan.steps[0].expected_output = "JSON list"
        plan.steps[0].tool_hints = ["read_file", "web_search"]
        prompt = ex._build_step_prompt(plan, plan.steps[0], [])
        assert "JSON list" in prompt
        assert "read_file" in prompt


class TestExecutorFinalSummary:
    def test_summary_uses_last_completed_result(self):
        ex = PlanExecutor()
        plan = _plan()
        plan.steps[0].status = StepStatus.COMPLETED
        plan.steps[0].result = "first"
        plan.steps[1].status = StepStatus.COMPLETED
        plan.steps[1].result = "FINAL"
        summary = ex._build_final_summary(plan)
        assert "FINAL" in summary

    def test_summary_when_no_completed(self):
        ex = PlanExecutor()
        plan = _plan()
        summary = ex._build_final_summary(plan)
        assert "tamamlanamadi" in summary.lower() or "tamamlanmadı" in summary.lower()


@pytest.mark.asyncio
class TestExecutorStreaming:
    async def _collect_events(self, gen):
        events: list[PlanEvent] = []
        async for evt in gen:
            events.append(evt)
        return events

    async def test_simple_two_step_pass(self):
        """Iki adimli bir plan — her ikisi de PASS — COMPLETED ile biter."""
        # Reflector hep PASS desin
        reflector = ReflectorService(enabled=False)
        ex = PlanExecutor(reflector=reflector, retry_limit=0, max_replan_count=0)

        plan = _plan(2)

        with patch(
            "app.services.planning.executor.run_agent_loop",
            new_callable=AsyncMock,
            side_effect=[_loop_result("r1"), _loop_result("r2")],
        ):
            events = await self._collect_events(
                ex.execute_streaming(plan, _agent(), history=[])
            )

        types = [e.type for e in events]
        assert "plan_started" in types
        assert types.count("step_started") == 2
        assert types.count("step_completed") == 2
        assert "plan_completed" in types
        assert plan.status == PlanStatus.COMPLETED
        # Son step result final_summary'ye girmeli
        assert "r2" in plan.final_summary

    async def test_loop_exception_marks_failed(self):
        reflector = ReflectorService(enabled=False)
        ex = PlanExecutor(reflector=reflector, retry_limit=0)
        plan = _plan(1)

        with patch(
            "app.services.planning.executor.run_agent_loop",
            new_callable=AsyncMock,
            side_effect=RuntimeError("boom"),
        ):
            events = await self._collect_events(
                ex.execute_streaming(plan, _agent(), history=[])
            )

        types = [e.type for e in events]
        assert "step_failed" in types
        assert "plan_failed" in types
        assert plan.status == PlanStatus.FAILED
        assert plan.steps[0].status == StepStatus.FAILED

    async def test_retry_then_pass(self):
        """Reflector ilk RETRY der, ikinci denemede PASS — basarili biter."""
        verdicts = iter([
            ReflectionDecision(ReflectionVerdict.RETRY, "kucuk hata", "tekrar dene"),
            ReflectionDecision(ReflectionVerdict.PASS, "tamam")])

        class FakeReflector(ReflectorService):
            async def evaluate(self, *args, **kwargs):
                return next(verdicts)

        ex = PlanExecutor(reflector=FakeReflector(enabled=True), retry_limit=2)
        plan = _plan(1)

        with patch(
            "app.services.planning.executor.run_agent_loop",
            new_callable=AsyncMock,
            side_effect=[_loop_result("first"), _loop_result("second")],
        ):
            events = await self._collect_events(
                ex.execute_streaming(plan, _agent(), history=[])
            )

        types = [e.type for e in events]
        assert "step_retry" in types
        assert "step_completed" in types
        assert plan.status == PlanStatus.COMPLETED
        # Son step 2 deneme yapilmis olmali
        assert plan.steps[0].attempts == 2

    async def test_retry_exhausts_marks_failed(self):
        """Reflector hep RETRY der — limit asilinca FAILED."""

        class AlwaysRetry(ReflectorService):
            async def evaluate(self, *args, **kwargs):
                return ReflectionDecision(ReflectionVerdict.RETRY, "hep hata")

        ex = PlanExecutor(reflector=AlwaysRetry(enabled=True), retry_limit=1)
        plan = _plan(1)

        with patch(
            "app.services.planning.executor.run_agent_loop",
            new_callable=AsyncMock,
            return_value=_loop_result("x"),
        ):
            events = await self._collect_events(
                ex.execute_streaming(plan, _agent(), history=[])
            )

        types = [e.type for e in events]
        # En az 1 retry + sonra fail
        assert types.count("step_retry") >= 1
        assert "plan_failed" in types
        assert plan.status == PlanStatus.FAILED

    async def test_fail_verdict_stops_immediately(self):
        class AlwaysFail(ReflectorService):
            async def evaluate(self, *args, **kwargs):
                return ReflectionDecision(ReflectionVerdict.FAIL, "imkansiz")

        ex = PlanExecutor(reflector=AlwaysFail(enabled=True))
        plan = _plan(2)

        with patch(
            "app.services.planning.executor.run_agent_loop",
            new_callable=AsyncMock,
            return_value=_loop_result("x"),
        ):
            events = await self._collect_events(
                ex.execute_streaming(plan, _agent(), history=[])
            )

        types = [e.type for e in events]
        assert types.count("step_started") == 1  # sadece 1. step calistirildi
        assert "plan_failed" in types
        assert plan.status == PlanStatus.FAILED