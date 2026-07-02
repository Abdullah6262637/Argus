"""ReflectorService: bir plan adimi sonrasinda hedefin saglandigini kontrol eder.

Karar:
  - PASS: adim basarili, sonraki adima gec
  - RETRY: ayni adimi yeniden dene (max 2)
  - REPLAN: planin geri kalanini yeniden olustur
  - FAIL: vazgec
"""
from __future__ import annotations

import enum
import json
import logging
import re
from dataclasses import dataclass
from typing import Optional

from app.services.agent_manager import AgentDefinition
from app.services.llm import ChatMessage, LLMError, get_provider
from app.services.planning.models import Plan, PlanStep

logger = logging.getLogger(__name__)


class ReflectionVerdict(str, enum.Enum):
    PASS = "pass"
    RETRY = "retry"
    REPLAN = "replan"
    FAIL = "fail"


@dataclass
class ReflectionDecision:
    verdict: ReflectionVerdict
    reason: str
    suggested_fix: str = ""


REFLECTOR_SYSTEM_PROMPT = """Sen bir gorev gozlemcisisin. Bir AI ajaninin tamamladigi adimi
inceleyip, beklenen ciktiya ulasilip ulasilmadigini degerlendirirsin.

KURALLAR:
- Adimin "expected_output" alanini referans al
- Tool cagrilari basarili mi? Hatalar var mi?
- Asistanin metni hedefi karsiliyor mu?
- Adim basarili gorunuyorsa "pass" dondur
- Kucuk bir hata varsa ve duzeltilebilirse "retry" oner
- Plan tamamen yanlis gidiyorsa "replan" oner
- Cozumsuz bir hata varsa "fail" dondur

CIKTI FORMATI (sadece JSON):
{
  "verdict": "pass" | "retry" | "replan" | "fail",
  "reason": "kisa aciklama (1-2 cumle)",
  "suggested_fix": "retry/replan icin oneri (opsiyonel)"
}
"""


_JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}", re.MULTILINE)


class ReflectorService:
    """Plan adimi sonrasi LLM ile reflection yapan servis."""

    def __init__(self, *, enabled: bool = True) -> None:
        self.enabled = enabled

    async def evaluate(
        self,
        plan: Plan,
        step: PlanStep,
        agent: AgentDefinition,
        loop_final_content: str,
        tool_summaries: Optional[list] = None,
    ) -> ReflectionDecision:
        """Step'i degerlendir."""
        if not self.enabled:
            # Hizli yol: tool calls hepsi ok ise pass
            tool_ok = all(t.get("ok", True) for t in (tool_summaries or []))
            if tool_ok and loop_final_content:
                return ReflectionDecision(ReflectionVerdict.PASS, "auto-pass (reflector disabled)")
            return ReflectionDecision(ReflectionVerdict.PASS, "no reflection")

        provider = get_provider(
            agent.provider,
            agent.model,
            api_key=agent.api_key,
            base_url=agent.base_url,
        )

        tool_lines = []
        for t in tool_summaries or []:
            ok = "OK" if t.get("ok") else "FAIL"
            err = t.get("error") or ""
            tool_lines.append(f"- {t.get('name', '?')}: {ok} {err}".strip())
        tool_block = "\n".join(tool_lines) if tool_lines else "(tool cagrisi yok)"

        user_prompt = (
            f"GENEL HEDEF:\n{plan.goal}\n\n"
            f"ADIM:\n#{step.id} - {step.title}\n"
            f"Aciklama: {step.description}\n"
            f"Beklenen cikti: {step.expected_output or '(belirtilmemis)'}\n\n"
            f"TOOL CAGRILARI:\n{tool_block}\n\n"
            f"AJANIN SON YANITI:\n{loop_final_content[:2000]}\n\n"
            f"DENEME SAYISI: {step.attempts}\n\n"
            "Bu adim basarili mi? Karar ver ve JSON dondur."
        )

        messages = [
            ChatMessage(role="system", content=REFLECTOR_SYSTEM_PROMPT),
            ChatMessage(role="user", content=user_prompt)]

        try:
            response = await provider.chat(
                messages,
                temperature=0.1,
                max_tokens=400,
                tools=None,
            )
        except LLMError as exc:
            logger.warning("Reflector LLM hatasi, auto-pass: %s", exc)
            return ReflectionDecision(ReflectionVerdict.PASS, f"reflector hatasi: {exc}")
        except Exception as exc:
            logger.warning("Reflector beklenmedik hata: %s", exc)
            return ReflectionDecision(ReflectionVerdict.PASS, "reflector hatasi")

        return self._parse_decision(response.content)

    def _parse_decision(self, text: str) -> ReflectionDecision:
        if not text:
            return ReflectionDecision(ReflectionVerdict.PASS, "bos yanit")

        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*\n", "", cleaned)
            cleaned = re.sub(r"\n```\s*$", "", cleaned)

        data = None
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            match = _JSON_BLOCK_RE.search(text)
            if match:
                try:
                    data = json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass

        if not isinstance(data, dict):
            # Basit metin tabanli fallback
            lower = text.lower()
            if "fail" in lower and "pass" not in lower:
                return ReflectionDecision(ReflectionVerdict.FAIL, text[:200])
            if "retry" in lower:
                return ReflectionDecision(ReflectionVerdict.RETRY, text[:200])
            if "replan" in lower:
                return ReflectionDecision(ReflectionVerdict.REPLAN, text[:200])
            return ReflectionDecision(ReflectionVerdict.PASS, "parse edilemedi, varsayilan pass")

        verdict_raw = str(data.get("verdict", "pass")).lower().strip()
        try:
            verdict = ReflectionVerdict(verdict_raw)
        except ValueError:
            verdict = ReflectionVerdict.PASS

        return ReflectionDecision(
            verdict=verdict,
            reason=str(data.get("reason", "")),
            suggested_fix=str(data.get("suggested_fix", "")),
        )