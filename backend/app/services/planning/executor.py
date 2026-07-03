"""PlanExecutor: bir Plan'i adim adim yurutur.

Her adim:
  1. status = RUNNING, emit 'step_started'
  2. agent_loop ile step.description'i calistir
  3. ReflectorService ile sonucu degerlendir
  4. PASS -> COMPLETED
     RETRY -> attempts < max ise step'i yeniden dene
     REPLAN -> kalan stepleri TaskPlanner ile yenile
     FAIL -> plan FAILED
  5. emit 'step_completed' / 'step_failed'

emit'ler async generator ile disariya verilir; SSE endpoint dogrudan tuketebilir.
"""
from __future__ import annotations

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional

from app.services.agent_loop import AgentLoopResult, run_agent_loop
from app.services.agent_manager import AgentDefinition
from app.services.llm import ChatMessage
from app.services.planning.models import Plan, PlanStatus, PlanStep, StepStatus
from app.services.planning.planner import TaskPlanner
from app.services.planning.reflector import (
    ReflectionDecision,
    ReflectionVerdict,
    ReflectorService,
)

# Sprint F.2: skill learning - basarili plan tamamlandiginda tool zincirini kaydet
try:
    from app.services.skill_extractor import record_successful_chain as _record_skill
    _SKILL_LEARNING_AVAILABLE = True
except Exception:  # pragma: no cover
    _SKILL_LEARNING_AVAILABLE = False
    _record_skill = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


@dataclass
class PlanEvent:
    """SSE/WS uzerinden disariya gonderilen olay."""

    type: str  # plan_created, step_started, step_completed, step_failed,
               # tool_call_started, tool_call_completed, reflection,
               # plan_completed, plan_failed
    data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PlanExecutionResult:
    plan: Plan
    final_content: str
    total_tool_calls: int = 0
    total_steps_run: int = 0
    success: bool = False


class PlanExecutor:
    """Bir plani step-by-step yuruten servis."""

    def __init__(
        self,
        *,
        retry_limit: int = 2,
        reflector: Optional[ReflectorService] = None,
        planner: Optional[TaskPlanner] = None,
        max_replan_count: int = 2,
        step_max_steps: int = 6,
        memory_context: Optional[str] = None,
    ) -> None:
        self.retry_limit = retry_limit
        self.reflector = reflector or ReflectorService()
        self.planner = planner or TaskPlanner()
        self.max_replan_count = max_replan_count
        self.step_max_steps = step_max_steps
        # Sprint 2.2: agent_loop'a iletilecek long-term memory baglami
        self.memory_context = memory_context

    async def execute_streaming(
        self,
        plan: Plan,
        agent: AgentDefinition,
        history: Optional[List[ChatMessage]] = None,
    ) -> AsyncIterator[PlanEvent]:
        """Plan'i calistir ve event'leri stream et."""
        if history is None:
            history = []

        plan.status = PlanStatus.RUNNING
        yield PlanEvent("plan_started", {"plan": plan.to_dict()})

        replan_count = 0
        total_tool_calls = 0
        total_steps_run = 0
        total_tokens = 0
        # Onceki adimlarin sonuclarini sonraki adimlara baglam olarak iletelim
        accumulated_context: List[str] = []

        idx = 0
        while idx < len(plan.steps):
            step = plan.steps[idx]
            if step.status == StepStatus.COMPLETED or step.status == StepStatus.SKIPPED:
                idx += 1
                continue

            # ---- Sprint F.3: Paralel grup tespiti ----
            # Mevcut step parallel=True ise ardisik parallel step'leri grupla.
            if step.parallel and step.status == StepStatus.PENDING:
                group: List[PlanStep] = [step]
                j = idx + 1
                while (
                    j < len(plan.steps)
                    and plan.steps[j].parallel
                    and plan.steps[j].status == StepStatus.PENDING
                ):
                    group.append(plan.steps[j])
                    j += 1
                if len(group) > 1:
                    async for evt in self._execute_parallel_group(
                        plan, group, agent, history, accumulated_context,
                    ):
                        yield evt
                    # Toplam sayaclar
                    for s in group:
                        total_tool_calls += sum(
                            1 for tc in s.tool_calls if isinstance(tc, dict)
                        )
                        total_steps_run += 1
                        if s.status == StepStatus.FAILED:
                            plan.status = PlanStatus.FAILED
                            plan.error = s.error or "Paralel grup hatasi"
                            yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                            return
                    idx = j
                    continue
                # Tek elemanli "paralel" grup -> normal sirali yurut
                # (asagi dus)

            step.status = StepStatus.RUNNING
            step.started_at = datetime.utcnow()
            step.attempts += 1
            total_steps_run += 1

            yield PlanEvent("step_started", {
                "plan_id": plan.id,
                "step": step.to_dict()})

            # Step icin agent'a verecegimiz prompt
            step_prompt = self._build_step_prompt(plan, step, accumulated_context)

            # Tool call event'lerini iceriden yakalamak icin queue
            event_queue: asyncio.Queue = asyncio.Queue()

            async def on_tool_event(event_type: str, payload: Dict[str, Any]) -> None:
                await event_queue.put(PlanEvent(event_type, {
                    "plan_id": plan.id,
                    "step_id": step.id,
                    **payload}))

            # agent_loop'u arka planda calistir, queue'dan event'leri stream et
            loop_task = asyncio.create_task(
                run_agent_loop(
                    agent,
                    history,
                    step_prompt,
                    max_steps=self.step_max_steps,
                    on_event=on_tool_event,
                    memory_context=self.memory_context,
                )
            )

            # Loop bitene kadar event'leri stream et
            loop_result: Optional[AgentLoopResult] = None
            while True:
                try:
                    evt = await asyncio.wait_for(event_queue.get(), timeout=0.2)
                    yield evt
                except asyncio.TimeoutError:
                    if loop_task.done():
                        # Kalan event'leri bosalt
                        while not event_queue.empty():
                            yield await event_queue.get()
                        break

            try:
                loop_result = await loop_task
                if loop_result and loop_result.total_tokens:
                    total_tokens += loop_result.total_tokens
            except Exception as exc:
                logger.exception("Step %d agent_loop hatasi", step.id)
                step.status = StepStatus.FAILED
                step.error = str(exc)
                step.completed_at = datetime.utcnow()
                yield PlanEvent("step_failed", {
                    "plan_id": plan.id,
                    "step": step.to_dict(),
                    "error": str(exc)})
                plan.status = PlanStatus.FAILED
                plan.error = f"Step {step.id} hatasi: {exc}"
                yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                return

            # Step verisini doldur
            step.result = loop_result.final_content
            step.tool_calls = [tc.to_dict() for tc in loop_result.tool_calls]
            total_tool_calls += len(loop_result.tool_calls)

            # Reflector
            decision = await self.reflector.evaluate(
                plan, step, agent,
                loop_final_content=loop_result.final_content,
                tool_summaries=step.tool_calls,
            )
            step.reflection = f"{decision.verdict.value}: {decision.reason}"

            yield PlanEvent("reflection", {
                "plan_id": plan.id,
                "step_id": step.id,
                "verdict": decision.verdict.value,
                "reason": decision.reason,
                "suggested_fix": decision.suggested_fix})

            if decision.verdict == ReflectionVerdict.PASS:
                step.status = StepStatus.COMPLETED
                step.completed_at = datetime.utcnow()
                accumulated_context.append(
                    f"[Adim #{step.id} - {step.title}]\n{loop_result.final_content[:500]}"
                )
                yield PlanEvent("step_completed", {
                    "plan_id": plan.id,
                    "step": step.to_dict()})
                idx += 1

            elif decision.verdict == ReflectionVerdict.RETRY:
                if step.attempts <= self.retry_limit:
                    # status'u tekrar PENDING yap; suggested_fix'i bagdaktan ekle
                    step.status = StepStatus.PENDING
                    if decision.suggested_fix:
                        step.description = (
                            step.description
                            + f"\n\n[ONCEKI DENEME GERIBILDIRIMI: {decision.suggested_fix}]"
                        )
                    yield PlanEvent("step_retry", {
                        "plan_id": plan.id,
                        "step_id": step.id,
                        "attempt": step.attempts})
                    # idx artmiyor - ayni step yeniden
                else:
                    step.status = StepStatus.FAILED
                    step.error = f"Max retry asildi: {decision.reason}"
                    step.completed_at = datetime.utcnow()
                    yield PlanEvent("step_failed", {
                        "plan_id": plan.id,
                        "step": step.to_dict()})
                    plan.status = PlanStatus.FAILED
                    plan.error = step.error
                    yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                    return

            elif decision.verdict == ReflectionVerdict.REPLAN:
                if replan_count >= self.max_replan_count:
                    step.status = StepStatus.FAILED
                    step.error = "Max replan asildi"
                    step.completed_at = datetime.utcnow()
                    plan.status = PlanStatus.FAILED
                    plan.error = step.error
                    yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                    return

                replan_count += 1
                # Mevcut step'i COMPLETED gibi tut, kalan step'leri yenile
                step.status = StepStatus.COMPLETED
                step.completed_at = datetime.utcnow()
                accumulated_context.append(
                    f"[Adim #{step.id} - {step.title}]\n{loop_result.final_content[:500]}"
                )
                yield PlanEvent("step_completed", {
                    "plan_id": plan.id,
                    "step": step.to_dict()})

                # Kalan step'leri at, yeniden planla
                history_summary = "\n".join(accumulated_context[-3:])
                replan_goal = (
                    f"{plan.goal}\n\n[Yeniden planlama: {decision.suggested_fix or decision.reason}]"
                )
                try:
                    new_plan = await self.planner.create_plan(
                        replan_goal,
                        agent,
                        conversation_id=plan.conversation_id,
                        history_summary=history_summary,
                    )
                    # Yeni step'leri eskinin uzerine ekle (id'leri yeniden numaralandir)
                    next_id = step.id + 1
                    for new_step in new_plan.steps:
                        new_step.id = next_id
                        next_id += 1
                    # Mevcut indeksten sonrakilerini sil, yeni step'leri koy
                    plan.steps = plan.steps[: idx + 1] + new_plan.steps
                    yield PlanEvent("plan_replanned", {
                        "plan_id": plan.id,
                        "new_steps": [s.to_dict() for s in new_plan.steps]})
                except Exception as exc:
                    logger.exception("Replan hatasi")
                    plan.status = PlanStatus.FAILED
                    plan.error = f"Replan hatasi: {exc}"
                    yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                    return
                idx += 1

            else:  # FAIL
                step.status = StepStatus.FAILED
                step.error = decision.reason
                step.completed_at = datetime.utcnow()
                yield PlanEvent("step_failed", {
                    "plan_id": plan.id,
                    "step": step.to_dict()})
                plan.status = PlanStatus.FAILED
                plan.error = decision.reason
                yield PlanEvent("plan_failed", {"plan": plan.to_dict()})
                return

        # Tum step'ler tamamlandi
        plan.status = PlanStatus.COMPLETED
        plan.completed_at = datetime.utcnow()
        # Final ozet: son step'in result'i + diger step ozetleri
        plan.final_summary = self._build_final_summary(plan)

        # Sprint F.2: Basarili plan -> skill learning
        # Tum tool cagrilarini birlestir ve SkillExtractor'a gonder
        if _SKILL_LEARNING_AVAILABLE and _record_skill is not None:
            try:
                full_chain: List[Dict[str, Any]] = []
                for s in plan.steps:
                    if s.status == StepStatus.COMPLETED and s.tool_calls:
                        for tc in s.tool_calls:
                            if isinstance(tc, dict) and tc.get("ok"):
                                full_chain.append({
                                    "name": tc.get("name"),
                                    "arguments": tc.get("arguments", {})})
                if full_chain:
                    await _record_skill(
                        agent_id=agent.id,
                        tool_chain=full_chain,
                        goal=plan.goal,
                    )
            except Exception as exc:  # pragma: no cover
                logger.warning("Skill learning kaydi basarisiz: %s", exc)

        yield PlanEvent("plan_completed", {
            "plan": plan.to_dict(),
            "final_summary": plan.final_summary,
            "total_tool_calls": total_tool_calls,
            "total_steps_run": total_steps_run,
            "total_tokens": total_tokens})

    async def execute(
        self,
        plan: Plan,
        agent: AgentDefinition,
        history: Optional[List[ChatMessage]] = None,
        on_event: Optional[Any] = None,
    ) -> PlanExecutionResult:
        """Plan'i calistir, tum event'leri (varsa) on_event callback'ine ilet."""
        total_tool_calls = 0
        total_steps_run = 0
        async for evt in self.execute_streaming(plan, agent, history):
            if on_event:
                try:
                    await on_event(evt.type, evt.data)
                except Exception as exc:  # pragma: no cover
                    logger.warning("on_event callback hata: %s", exc)
            if evt.type == "tool_call_completed":
                total_tool_calls += 1
            if evt.type == "step_started":
                total_steps_run += 1

        success = plan.status == PlanStatus.COMPLETED
        return PlanExecutionResult(
            plan=plan,
            final_content=plan.final_summary,
            total_tool_calls=total_tool_calls,
            total_steps_run=total_steps_run,
            success=success,
        )

    # ---------- Paralel grup yurutucusu ----------

    async def _execute_parallel_group(
        self,
        plan: Plan,
        group: List[PlanStep],
        agent: AgentDefinition,
        history: List[ChatMessage],
        accumulated_context: List[str],
    ) -> AsyncIterator[PlanEvent]:
        """Bir grup parallel=True step'i asyncio.gather ile es-zamanli yurut.

        - Her step icin ayri agent_loop task'i acilir.
        - Tool event'leri ortak queue uzerinden tagged (step_id ile) stream edilir.
        - Hepsi tamamlandiktan sonra her step icin reflector PASS/FAIL kararlari
          verilir; bu surumde paralel grupta RETRY/REPLAN desteklenmez.
        """
        logger.info(
            "Paralel grup baslatiliyor (plan=%s, %d step)", plan.id, len(group)
        )

        event_queue: asyncio.Queue = asyncio.Queue()

        def make_callback(step_id: int):
            async def cb(event_type: str, payload: Dict[str, Any]) -> None:
                await event_queue.put(PlanEvent(event_type, {
                    "plan_id": plan.id,
                    "step_id": step_id,
                    "parallel": True,
                    **payload}))
            return cb

        # Her step icin task olustur
        tasks: Dict[int, asyncio.Task] = {}
        for step in group:
            step.status = StepStatus.RUNNING
            step.started_at = datetime.utcnow()
            step.attempts += 1
            yield PlanEvent("step_started", {
                "plan_id": plan.id,
                "step": step.to_dict(),
                "parallel": True})
            step_prompt = self._build_step_prompt(plan, step, accumulated_context)
            tasks[step.id] = asyncio.create_task(
                run_agent_loop(
                    agent,
                    history,
                    step_prompt,
                    max_steps=self.step_max_steps,
                    on_event=make_callback(step.id),
                    memory_context=self.memory_context,
                )
            )

        # Tum task'lar bitene kadar event'leri stream et
        pending_tasks = set(tasks.values())
        while pending_tasks:
            try:
                evt = await asyncio.wait_for(event_queue.get(), timeout=0.2)
                yield evt
            except asyncio.TimeoutError:
                done = {t for t in pending_tasks if t.done()}
                pending_tasks -= done
                if not pending_tasks:
                    while not event_queue.empty():
                        yield await event_queue.get()
                    break

        # Sonuclari topla
        for step in group:
            try:
                loop_result: AgentLoopResult = await tasks[step.id]
                if loop_result and loop_result.total_tokens:
                    total_tokens += loop_result.total_tokens
                step.result = loop_result.final_content
                step.tool_calls = [tc.to_dict() for tc in loop_result.tool_calls]
                step.status = StepStatus.COMPLETED
                step.completed_at = datetime.utcnow()
                step.reflection = "PASS: paralel grup (auto)"
                accumulated_context.append(
                    f"[Adim #{step.id} - {step.title}]\n{loop_result.final_content[:500]}"
                )
                yield PlanEvent("step_completed", {
                    "plan_id": plan.id,
                    "step": step.to_dict(),
                    "parallel": True})
            except Exception as exc:
                logger.exception("Paralel step %d hatasi", step.id)
                step.status = StepStatus.FAILED
                step.error = str(exc)
                step.completed_at = datetime.utcnow()
                yield PlanEvent("step_failed", {
                    "plan_id": plan.id,
                    "step": step.to_dict(),
                    "error": str(exc),
                    "parallel": True})

    # ---------- Yardimci ----------

    def _build_step_prompt(
        self, plan: Plan, step: PlanStep, accumulated_context: List[str]
    ) -> str:
        parts = [
            f"GENEL HEDEF: {plan.goal}",
            f"\nSU ANKI ADIM ({step.id}/{len(plan.steps)}): {step.title}",
            f"\nNE YAPILACAK: {step.description}"]
        if step.expected_output:
            parts.append(f"\nBEKLENEN CIKTI: {step.expected_output}")
        if step.tool_hints:
            parts.append(f"\nONERILEN ARACLAR: {', '.join(step.tool_hints)}")
        if accumulated_context:
            parts.append("\nONCEKI ADIM CIKTILARI:\n" + "\n\n".join(accumulated_context[-3:]))
        parts.append(
            "\nLutfen sadece BU ADIMI tamamla. Tum hedefi tek seferde cozmeye calisma. "
            "Gerekiyorsa araclari kullan; sonunda bu adimin ciktisini ozet bir metinle ver."
        )
        return "\n".join(parts)

    def _build_final_summary(self, plan: Plan) -> str:
        # Son step'in cevabi varsa onu doner; yoksa tum step'lerin ozeti
        completed = [s for s in plan.steps if s.status == StepStatus.COMPLETED]
        if not completed:
            return "(Plan tamamlanamadi.)"
        last = completed[-1]
        if last.result:
            # Coklu step varsa ufak bir baslik ekle
            if len(plan.steps) > 1:
                return last.result.strip()
            return last.result.strip()
        # Yedek: tum sonuclari birlestir
        return "\n\n".join(
            f"### Adim {s.id}: {s.title}\n{s.result}" for s in completed if s.result
        )