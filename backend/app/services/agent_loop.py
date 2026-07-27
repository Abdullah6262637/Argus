"""Agent Loop: cok-turlu ReAct dongusu.

Akis:
  1. Kullanici mesajini al
  2. LLM'i tool listesi ile cagir (native function calling)
  3. Eger LLM native tool cagrisi yapmadi ama metinde XML/JSON formatinda
     tool cagrisi varsa onu parse et (proxy/yerel modeller icin fallback)
  4. Tool'lari calistir, sonuclari mesaj olarak ekle
  5. LLM tool cagrisi yapmayana kadar (veya max_steps'e) tekrarla
  6. Son metin yanitini geri ver

Her tool cagrisi:
  - WS uzerinden 'tool_call_started' / 'tool_call_completed' yayinlanir
  - DB'ye Log olarak yazilir
  - Tool sonucu LLM'e geri donusturulur
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from app.services.agent_manager import AgentDefinition
from app.services.llm import ChatMessage, LLMError, LLMResponse, ToolCall, get_provider
from app.services.tool_parser import build_text_tool_instructions, parse_text_tool_calls
from app.services.tools import ToolContext, tool_registry

logger = logging.getLogger(__name__)


@dataclass
class ToolCallRecord:
    id: str
    name: str
    arguments: Dict[str, Any]
    ok: bool = False
    output: str = ""
    error: Optional[str] = None
    data: Dict[str, Any] = field(default_factory=dict)
    duration_ms: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "arguments": self.arguments,
            "ok": self.ok,
            "output": self.output,
            "error": self.error,
            "data": self.data,
            "duration_ms": self.duration_ms}


@dataclass
class AgentLoopResult:
    """Agent loop sonucu."""

    final_content: str
    tool_calls: List[ToolCallRecord] = field(default_factory=list)
    steps: int = 0
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_tokens: int = 0
    provider: str = ""
    model: str = ""
    stop_reason: Optional[str] = None


ToolEventCallback = Any  # async def cb(event_type: str, payload: dict) -> None


# Kurumsal cevap stili — tum ajanlara enjekte edilir.
# UI zaten tool sonuclarini ayri kart olarak gosteriyor; LLM'in metin
# yanitinda araç-detayı ya da emoji tekrarlamasina gerek yok.
PROFESSIONAL_RESPONSE_STYLE = """
[CEVAP STILI — KURUMSAL]
Yanitlarini su kurallara gore yaz:

1. KISA VE NET: Kullaniciya 1-3 kisa cumle ile dogrudan cevap ver. Uzatma.
2. EMOJI YOK: Hicbir emoji kullanma. Yildiz, kalp, tik, cop kutusu, parmak isareti
   gibi semboller dahil — hicbiri.
3. MARKDOWN MINIMAL:
   - Baslik ("##", "###") ASLA kullanma — kullanici tek soru sordu, makale degil.
   - **Bold** sadece kritik bir degeri vurgulamak icin (1-2 kelime).
   - Listeleri sadece gercekten birden fazla madde varsa kullan.
   - Code block sadece kullanicinin kopyalayip yapistirmasi gereken icin.
4. TOOL TEKRAR ETME: Bir araç calistirdiysan "X aracini calistirdim" deme.
   UI zaten tool kartini ayri gosteriyor. Sadece SONUCU dogal dille soyle.
   - YANLIS: "delete_file aracini calistirdim ve dosya silindi."
   - DOGRU: "Dosya silindi."
5. STATUS RAPORU YOK: "Adim 2 Tamamlandi", "Genel hedef tamamlandi" gibi
   meta-yorum yapma. Sadece sonucu bildir.
6. RESMI VE OLCULU: Kibirli ya da asiri rahat olma. Sade, profesyonel ton kullan.
7. ASLA OZUR DILEME: "Maalesef", "Uzgunum" gibi gereksiz kibarlik kaliplari kullanma.
   Hata varsa direkt soyle: "Dosya bulunamadi." gibi.

ORNEK — Iyi cevap (bir dosya silme isleminden sonra):
   Dosya silindi: `C:\\Users\\HP\\Desktop\\Yeni Metin Belgesi.txt`

ORNEK — Kotu cevap (bunu YAPMA):
   ## Adim 2 Tamamlandi ✓
   **Silinen dosya:**
   ```
   C:\\Users\\HP\\Desktop\\Yeni Metin Belgesi.txt
   ```
   `delete_file` aracini calistirdim ve dosya basariyla silindi. 🗑️
""".strip()


def _build_system_prompt(
    agent: AgentDefinition,
    tool_names: List[str],
    memory_context: Optional[str] = None,
) -> Optional[str]:
    """Agent'in system prompt'una tool kullanim talimatlari ve memory ekle."""
    base = agent.system_prompt or ""

    parts: List[str] = []
    if base:
        parts.append(base)

    if tool_names:
        names_csv = ", ".join(tool_names)
        text_instructions = build_text_tool_instructions(tool_names)
        behavioral = (
            "Sen sistem araçlarına (tools) erişimi olan yetkili bir ajan platformusun. "
            "Kullanıcı bir istekte bulunduğunda yetkili olduğun araçları kullanarak işlemi gerçekleştir. "
            "Eğer bir araç simüle edilmiş çıktı veriyorsa, gerekli kimlik bilgisi yoksa veya işlem başarısızsa "
            "bunu kullanıcıya dürüstçe bildir; asla yapılmamış bir işlemi yapılmış gibi gösterme.\n\n"
            f"Sahip olduğun araçlar: {names_csv}.\n\n"
            + text_instructions
        )
        parts.append(behavioral)

    # Kurumsal cevap stili — UI'da emoji/baslik/status raporu istemiyoruz
    parts.append(PROFESSIONAL_RESPONSE_STYLE)

    if memory_context and memory_context.strip():
        parts.append(
            "<memory>\n"
            "Asagida bu ajanin gecmis konusmalarindan ilgili HATIRLAR yer aliyor. "
            "Bu hatiralari mevcut kullanici sorusunu anlamak ve daha iyi cevap vermek "
            "icin BAGLAM olarak kullan. Hatira ile mevcut soru CELISIRSE, mevcut soruyu "
            "esas al ve gerekirse tekrar dogrula.\n\n"
            f"{memory_context.strip()}\n"
            "</memory>"
        )

    if not parts:
        return None
    return "\n\n---\n".join(parts)


def _get_fallback_provider_info(primary_provider: str, primary_model: str) -> Optional[tuple[str, str]]:
    """Cevap alinamamasi durumunda API anahtari olan yedek LLM seceneklerini doner."""
    import os
    from app.services.security.secrets import decrypt

    def _get_key(env_name: str) -> Optional[str]:
        val = os.environ.get(env_name)
        if val and val.strip():
            return decrypt(val.strip())
        return None

    # 1. Gemini
    gemini_key = _get_key("GEMINI_API_KEY") or _get_key("GOOGLE_API_KEY")
    if gemini_key and primary_provider != "gemini":
        return "gemini", "gemini-1.5-flash"
        
    # 2. OpenRouter (Llama 3 Free)
    openrouter_key = _get_key("OPENROUTER_API_KEY")
    if openrouter_key and primary_provider != "openrouter":
        return "openrouter", "meta-llama/llama-3-8b-instruct:free"

    # 3. Groq (Llama 3)
    groq_key = _get_key("GROQ_API_KEY")
    if groq_key and primary_provider != "groq":
        return "groq", "llama3-8b-8192"

    # 4. Yerel Ollama
    if primary_provider != "ollama" and primary_provider != "local":
        return "ollama", "qwen2.5:7b-instruct"
        
    return None


async def run_agent_loop(
    agent: AgentDefinition,
    history: List[ChatMessage],
    user_message: str,
    *,
    max_steps: int = 8,
    on_event: Optional[ToolEventCallback] = None,
    memory_context: Optional[str] = None,
    parent_context: Optional[ToolContext] = None,
) -> AgentLoopResult:
    """Bir kullanici mesajini ajanin tool'lariyla cok-turlu olarak isler.

    Args:
        memory_context: Vector store'dan gelen ilgili gecmis ozetler (Sprint 2.2).
            Sistem prompt'a `<memory>` blogu olarak eklenir.
    """
    import time

    provider_name = agent.provider
    provider = get_provider(
        provider_name,
        agent.model,
        api_key=agent.api_key,
        base_url=agent.base_url,
    )

    # Tool schemalarini izinlere gore filtrele
    available_tools = tool_registry.filter_for_agent(agent.permissions)
    if provider_name == "anthropic":
        tools_schema = tool_registry.anthropic_schemas(agent.permissions)
        tool_names = [t.name for t in available_tools][:128]
    else:
        tools_schema = tool_registry.openai_schemas(agent.permissions, provider_name=provider_name)
        limit = 30 if provider_name.lower() == "groq" else 128
        tool_names = [t.name for t in available_tools][:limit]

    # Mesaj listesini insa et
    messages: List[ChatMessage] = []
    sys_prompt = _build_system_prompt(agent, tool_names, memory_context=memory_context)
    if sys_prompt:
        messages.append(ChatMessage(role="system", content=sys_prompt))
    messages.extend(history)
    messages.append(ChatMessage(role="user", content=user_message))

    if parent_context:
        context = ToolContext(
            agent_id=agent.id,
            agent_name=agent.name,
            workspace_dir=parent_context.workspace_dir,
            extra=parent_context.extra,
        )
    else:
        context = ToolContext(agent_id=agent.id, agent_name=agent.name)
    result = AgentLoopResult(final_content="", provider=provider_name, model=agent.model)

    for step in range(1, max_steps + 1):
        result.steps = step
        try:
            response: LLMResponse = await provider.chat(
                messages,
                temperature=agent.temperature,
                max_tokens=agent.max_tokens,
                tools=tools_schema if tools_schema else None,
            )
        except Exception as primary_exc:
            logger.warning(
                "Primary LLM provider %s (%s) failed: %s. Fallback checking...",
                provider_name, agent.model, primary_exc
            )
            fallback_info = _get_fallback_provider_info(provider_name, agent.model)
            if fallback_info:
                fb_provider_name, fb_model = fallback_info
                logger.info(
                    "[FALLBACK AKTIF] Birincil saglayici (%s - %s) hata verdi: %s. "
                    "Alternatif saglayiciya geciliyor: %s (%s)",
                    provider_name, agent.model, primary_exc, fb_provider_name, fb_model
                )
                try:
                    fallback_provider = get_provider(
                        fb_provider_name,
                        fb_model,
                    )
                    fb_tools_schema = (
                        tool_registry.anthropic_schemas(agent.permissions)
                        if fb_provider_name == "anthropic"
                        else tool_registry.openai_schemas(agent.permissions)
                    )
                    
                    response = await fallback_provider.chat(
                        messages,
                        temperature=agent.temperature,
                        max_tokens=agent.max_tokens,
                        tools=fb_tools_schema if fb_tools_schema else None,
                    )
                    
                    # Sonuc bilgisini guncelle
                    result.provider = fb_provider_name
                    result.model = fb_model
                    provider = fallback_provider
                    provider_name = fb_provider_name
                    tools_schema = fb_tools_schema
                    
                except Exception as fb_exc:
                    logger.error("Fallback LLM saglayicisi da hata verdi: %s", fb_exc)
                    raise LLMError(
                        f"Birincil LLM hatasi: {primary_exc} | Yedek LLM hatasi: {fb_exc}"
                    ) from fb_exc
            else:
                if isinstance(primary_exc, LLMError):
                    raise
                raise LLMError(f"LLM cagrisi sirasinda hata: {primary_exc}") from primary_exc

        # Token bilgileri
        if response.prompt_tokens:
            result.total_prompt_tokens += response.prompt_tokens
        if response.completion_tokens:
            result.total_completion_tokens += response.completion_tokens
        if response.total_tokens:
            result.total_tokens += response.total_tokens
        result.stop_reason = response.stop_reason

        # 1) Native tool cagrisi var mi?
        tool_calls: List[ToolCall] = list(response.tool_calls)
        cleaned_content = response.content

        # 2) Yoksa metinde XML/JSON tool cagrisi var mi?
        used_text_format = False
        if not tool_calls and response.content:
            cleaned_content, parsed_calls = parse_text_tool_calls(response.content)
            if parsed_calls:
                tool_calls = parsed_calls
                used_text_format = True
                logger.info(
                    "Metinsel tool format yakalandi (%d cagri) - native function "
                    "calling kullanilmiyor",
                    len(parsed_calls),
                )

        # Tool cagrisi yoksa cikis
        if not tool_calls:
            result.final_content = response.content
            return result

        # LLM'in tool cagrisi yaptigi asistan mesajini gecmise ekle
        # Native format icin tool_calls iletilir; metinsel formatta sadece icerik.
        if used_text_format:
            messages.append(
                ChatMessage(role="assistant", content=response.content)
            )
        else:
            messages.append(
                ChatMessage(
                    role="assistant",
                    content=cleaned_content,
                    tool_calls=tool_calls,
                )
            )

        # Her tool'u sirayla calistir
        for tc in tool_calls:
            await _emit(on_event, "tool_call_started", {
                "id": tc.id,
                "name": tc.name,
                "arguments": tc.arguments,
                "agent_id": agent.id,
                "step": step})

            t_start = time.time()
            tool_result = await tool_registry.execute(
                tc.name, tc.arguments, agent.permissions, context
            )
            duration_ms = int((time.time() - t_start) * 1000)

            record = ToolCallRecord(
                id=tc.id,
                name=tc.name,
                arguments=tc.arguments,
                ok=tool_result.ok,
                output=tool_result.output,
                error=tool_result.error,
                data=tool_result.data,
                duration_ms=duration_ms,
            )
            result.tool_calls.append(record)

            await _emit(on_event, "tool_call_completed", {
                **record.to_dict(),
                "agent_id": agent.id,
                "step": step})

            # LLM'e geri verecegimiz mesaji ekle
            if used_text_format:
                # Metinsel format - tool sonucunu user mesaji gibi ekle
                messages.append(
                    ChatMessage(
                        role="user",
                        content=f"[ARAC SONUCU: {tc.name}]\n{tool_result.to_llm_string()}",
                    )
                )
            else:
                messages.append(
                    ChatMessage(
                        role="tool",
                        content=tool_result.to_llm_string(),
                        tool_call_id=tc.id,
                        tool_name=tc.name,
                    )
                )

    # Max step asildi
    logger.warning("Agent loop max_steps=%d asildi", max_steps)
    if not result.final_content:
        result.final_content = (
            "(Maksimum tool adimina ulasildi. Lutfen istegini daha kucuk parcalara bol.)"
        )
    return result


async def _emit(callback: Optional[ToolEventCallback], event_type: str, payload: Dict[str, Any]) -> None:
    if callback is None:
        return
    try:
        await callback(event_type, payload)
    except Exception as exc:  # pragma: no cover
        logger.warning("Event callback hata: %s", exc)