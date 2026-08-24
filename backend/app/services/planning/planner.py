"""TaskPlanner: kullanici hedefini multi-step plan'a doker.

LLM'i tek bir cagrida JSON output'la zorlar (tool kullanmadan).
Cikti: Plan(steps=[...]).
"""
from __future__ import annotations

import json
import logging
import re
from typing import List, Optional

from app.services.agent_manager import AgentDefinition
from app.services.llm import ChatMessage, LLMError, get_provider
from app.services.planning.models import Plan, PlanStep, PlanStatus
from app.services.tools import tool_registry

logger = logging.getLogger(__name__)


PLANNER_SYSTEM_PROMPT = """Sen bir gorev planlayicisisin. Kullanicinin hedefini analiz edip,
bunu 1-7 adimda net, sirali ve uygulanabilir bir plana bolersin.

KURALLAR:
- Her adim TEK bir net hedefe odaklanmali
- Adimlar birbirini takip etmeli (bir oncekinin ciktisini kullanabilir)
- Karmasik veya gereksiz adimlar olusturma
- Tek adimda tamamlanabilecek basit istekler icin 1 step yeterli
- Adim sayisi: minimum 1, maksimum 7
- Her adim icin onerilebilecek tool'lari "tool_hints" listesinde belirt
- PARALEL YURUTME: Eger bir adim, oncesindeki paralel adimlarin ciktisina BAGIMLI DEGILSE
  ve ayni zamanda calistirilabilirse "parallel": true belirt. Ornekler:
  * "Wikipedia'da X ara" + "ArXiv'de X ara" → ikisi de parallel: true
  * "5 farkli URL'i indir" → her biri parallel: true
  Bagimli adimlar (ornek: "araliyi indir, sonra ozet cikar") parallel: false olmali.

CIKTI FORMATI (sadece JSON, baska aciklama YOK):
{
  "reasoning": "kisa dusunce sureci (1-2 cumle)",
  "steps": [
    {
      "title": "Kisa baslik (max 80 karakter)",
      "description": "Detayli aciklama - ajan bu metni dogrudan calistiracak",
      "expected_output": "Bu adimdan ne ciktisi beklenir",
      "tool_hints": ["tool_adi_1", "tool_adi_2"],
      "parallel": false
    }
  ]
}
"""


# JSON cikartmak icin regex (yedek parser)
_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}", re.MULTILINE)


class TaskPlanner:
    """Bir hedefi LLM ile plana doker."""

    def __init__(
        self,
        max_steps: int = 7,
        *,
        memory_context: Optional[str] = None,
    ) -> None:
        self.max_steps = max_steps
        # Sprint 2.2: gecmis konusma ozetlerinden gelen baglam
        self.memory_context = memory_context

    async def create_plan(
        self,
        goal: str,
        agent: AgentDefinition,
        *,
        conversation_id: Optional[int] = None,
        history_summary: Optional[str] = None,
    ) -> Plan:
        """Hedef icin plan uret."""
        # Mevcut tool isimleri (hint olarak)
        available_tools = tool_registry.filter_for_agent(agent.permissions)
        tool_names = [t.name for t in available_tools]
        tool_descs = "\n".join(f"- {t.name}: {t.description}" for t in available_tools[:30])

        provider = get_provider(
            agent.provider,
            agent.model,
            api_key=agent.api_key,
            base_url=agent.base_url,
        )

        user_prompt_parts = [f"HEDEF:\n{goal}\n"]
        if self.memory_context and self.memory_context.strip():
            user_prompt_parts.append(
                f"\nGECMIS HATIRLAR (ilgili konusma ozetleri):\n{self.memory_context.strip()}\n"
            )
        if history_summary:
            user_prompt_parts.append(f"\nONCEKI BAGLAM (ozet):\n{history_summary}\n")
        if tool_descs:
            user_prompt_parts.append(f"\nMEVCUT ARACLAR:\n{tool_descs}\n")
        user_prompt_parts.append(
            f"\nLutfen yukaridaki hedef icin {self.max_steps} adimi gecmeyen "
            "bir plan uret. SADECE JSON dondur."
        )
        user_prompt = "\n".join(user_prompt_parts)

        messages = [
            ChatMessage(role="system", content=PLANNER_SYSTEM_PROMPT),
            ChatMessage(role="user", content=user_prompt)]

        try:
            response = await provider.chat(
                messages,
                temperature=0.3,  # planlamada determinizm
                max_tokens=2000,
                tools=None,  # tool kullanma!
            )
        except LLMError:
            raise
        except Exception as exc:
            raise LLMError(f"Planner LLM hatasi: {exc}") from exc

        plan_data = self._parse_plan_json(response.content)
        steps = self._build_steps(plan_data.get("steps", []), tool_names)

        # En az 1 step olmali
        if not steps:
            steps = [
                PlanStep(  # type: ignore[call-arg]
                    id=1,
                    title="Hedefi tek adimda yerine getir",
                    description=goal,
                    expected_output="Kullanicinin istegine uygun bir cevap.",
                    tool_hints=[],
                )
            ]

        plan = Plan(
            goal=goal,
            agent_id=agent.id,
            conversation_id=conversation_id,
            steps=steps,
            status=PlanStatus.DRAFT,
            metadata={"reasoning": plan_data.get("reasoning", "")},
        )
        logger.info(
            "Plan olusturuldu (agent=%s, steps=%d): %s",
            agent.id, len(steps), goal[:60],
        )
        return plan

    def _parse_plan_json(self, text: str) -> dict:
        """LLM ciktidan JSON cikar - tolerant parser."""
        if not text:
            return {}

        # 1) Direkt JSON parse dene
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        cleaned = text.strip()
        # Markdown code block sar
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*\n", "", cleaned)
            cleaned = re.sub(r"\n```\s*$", "", cleaned)

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # 2) Regex ile ilk JSON object'i yakala
        match = _JSON_BLOCK_RE.search(text)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

        # 3) Array fallback
        array_match = re.search(r"\[[\s\S]*\]", text)
        if array_match:
            try:
                data = json.loads(array_match.group(0))
                if isinstance(data, list):
                    return {"steps": data}
            except json.JSONDecodeError:
                pass

        logger.error("Planner JSON parse edilemedi, ham metin: %s", text[:200])
        return {}

    def _build_steps(self, raw_steps: list, available_tools: List[str]) -> List[PlanStep]:
        steps: List[PlanStep] = []
        for idx, item in enumerate(raw_steps[: self.max_steps], start=1):
            if not isinstance(item, dict):
                continue
            title = str(item.get("title", "")).strip() or f"Adim {idx}"
            description = str(item.get("description", "")).strip() or title
            expected = str(item.get("expected_output", "")).strip()
            hints_raw = item.get("tool_hints", [])
            hints: List[str] = []
            if isinstance(hints_raw, list):
                for h in hints_raw:
                    if isinstance(h, str) and h.strip():
                        # gercekten mevcut olanlari tut
                        if h in available_tools:
                            hints.append(h)
            parallel = bool(item.get("parallel", False))
            steps.append(
                PlanStep(  # type: ignore[call-arg]
                    id=idx,
                    title=title[:120],
                    description=description,
                    expected_output=expected,
                    tool_hints=hints,
                    parallel=parallel,
                )
            )
        return steps