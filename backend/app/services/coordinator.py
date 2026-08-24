"""Sprint F.1: CoordinatorService — kullanici istegini analiz edip uygun ajana yonlendirir.

Akis:
  1. classify(user_message, available_agents) -> hangi ajana?
  2. Eger 'self' donerse, koordinator dogrudan cevaplar
  3. Aksi halde delegate_to_agent ile uzman ajan calisir

LLM tabanli (basit single-turn) classifier; tool kullanmaz.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import dataclass
from typing import List, Optional

from app.services.agent_manager import AgentDefinition, agent_manager
from app.services.llm import ChatMessage, LLMError, get_provider

logger = logging.getLogger(__name__)


CLASSIFIER_SYSTEM = """Sen UmtalAgent sisteminin yonlendirme beynisin.

Gorevin: Kullanicinin mesajini analiz et ve hangi uzman ajana yonlendirilmeli oldugunu belirle.

KURALLAR:
- Mevcut uzman ajanlarin listesi ve uzmanliklari sana verilecek
- Kullanicinin niyetiyle en uyumlu ajani sec
- Eger basit/genel sohbet veya selam ise "self" dondur (koordinator dogrudan cevaplar)
- Birden fazla ajan gerekirse list olarak sirala (sira onemli)
- Kararsizsan "self" dondur (asla yanlis ajana yonlendirme)

CIKTI FORMATI (sadece JSON, baska aciklama YOK):
{
  "primary": "agent_id veya 'self'",
  "chain": ["agent_id_1", "agent_id_2"],   // opsiyonel coklu adim
  "reason": "1-2 cumle aciklama"
}

ORNEKLER:

Kullanici: "Selam, naber?"
{
  "primary": "self",
  "chain": [],
  "reason": "Genel sohbet, koordinator yanitlar"
}

Kullanici: "TypeScript'te debounce fonksiyonu yaz"
{
  "primary": "developer",
  "chain": ["developer"],
  "reason": "Kod yazma istegi - developer ajani uygun"
}

Kullanici: "Yapay zeka haberlerini topla ve blog yaz"
{
  "primary": "researcher",
  "chain": ["researcher", "writer"],
  "reason": "Once arastirma sonra yazma; iki ajanli zincir"
}
"""


@dataclass
class CoordinatorDecision:
    """Koordinator karari."""

    primary: str           # agent_id veya 'self'
    chain: List[str]       # coklu adim icin sirali ajan listesi
    reason: str
    self_handled: bool     # primary == 'self'


_JSON_RE = re.compile(r"\{[\s\S]*?\}", re.MULTILINE)


class CoordinatorService:
    """Kullanici istegini analiz edip yonlendirme karari veren servis."""

    def __init__(self, *, coordinator_agent_id: str = "coordinator") -> None:
        self.coordinator_agent_id = coordinator_agent_id

    def _build_agent_catalog(self, exclude_self: bool = True) -> str:
        """Mevcut aktif ajanlari LLM'e taniticak metin halinde dondur."""
        agents = agent_manager.list_agents(include_inactive=False)
        lines: List[str] = []
        for a in agents:
            if exclude_self and a.id == self.coordinator_agent_id:
                continue
            tags = ", ".join(a.tags) if a.tags else "-"
            lines.append(
                f"- id: `{a.id}` | name: {a.name} | role: {a.role or '-'} | "
                f"tags: {tags}\n  {a.description or '(aciklama yok)'}"
            )
        return "\n".join(lines) if lines else "(uzman ajan yok)"

    async def classify(
        self,
        user_message: str,
        coordinator: Optional[AgentDefinition] = None,
    ) -> CoordinatorDecision:
        """Kullanici mesajini ajana yonlendirme karari ver.

        Eger coordinator agent definition'i verilmezse `self.coordinator_agent_id`
        ile DB'den alinir. LLM hatasi olursa fallback olarak 'self' donulur.
        """
        if coordinator is None:
            coordinator = agent_manager.get(self.coordinator_agent_id)
            if coordinator is None:
                logger.warning(
                    "Coordinator ajani bulunamadi (id=%s); 'self' fallback",
                    self.coordinator_agent_id,
                )
                return CoordinatorDecision(
                    primary="self", chain=[], reason="coordinator yok", self_handled=True,
                )

        catalog = self._build_agent_catalog()

        provider = get_provider(
            coordinator.provider,
            coordinator.model,
            api_key=coordinator.api_key,
            base_url=coordinator.base_url,
        )

        user_prompt = (
            f"MEVCUT UZMAN AJANLAR:\n{catalog}\n\n"
            f"KULLANICI MESAJI:\n{user_message}\n\n"
            "JSON karar dondur."
        )

        messages = [
            ChatMessage(role="system", content=CLASSIFIER_SYSTEM),
            ChatMessage(role="user", content=user_prompt)]

        try:
            response = await provider.chat(
                messages,
                temperature=0.1,
                max_tokens=400,
                tools=None,
            )
        except LLMError as exc:
            logger.warning("Coordinator LLM hata, self fallback: %s", exc)
            return CoordinatorDecision("self", [], f"llm hata: {exc}", True)
        except Exception as exc:  # pragma: no cover
            logger.warning("Coordinator beklenmedik hata: %s", exc)
            return CoordinatorDecision("self", [], "hata", True)

        return self._parse_decision(response.content)

    def _parse_decision(self, text: str) -> CoordinatorDecision:
        if not text:
            return CoordinatorDecision("self", [], "bos yanit", True)

        cleaned = text.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*\n", "", cleaned)
            cleaned = re.sub(r"\n```\s*$", "", cleaned)

        data = None
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            m = _JSON_RE.search(text)
            if m:
                try:
                    data = json.loads(m.group(0))
                except json.JSONDecodeError:
                    pass

        if not isinstance(data, dict):
            return CoordinatorDecision("self", [], "JSON parse hatasi, self fallback", True)

        primary = str(data.get("primary", "self")).strip() or "self"
        chain_raw = data.get("chain", []) or []
        chain = [str(c).strip() for c in chain_raw if isinstance(c, str) and c.strip()]
        reason = str(data.get("reason", ""))

        # Var olmayan agent_id verirse self'e dus
        if primary != "self" and agent_manager.get(primary) is None:
            logger.warning("Coordinator gecersiz ajan onerdi: %s; self fallback", primary)
            return CoordinatorDecision("self", [], f"gecersiz ajan: {primary}", True)

        # Chain'deki gecersiz id'leri at
        chain = [c for c in chain if agent_manager.get(c) is not None]

        return CoordinatorDecision(
            primary=primary,
            chain=chain,
            reason=reason,
            self_handled=(primary == "self"),
        )


# Singleton
coordinator_service = CoordinatorService()