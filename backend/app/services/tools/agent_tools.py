"""Agent-to-agent delegasyon tool'u (FAZ 4.1)."""
from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class DelegateToAgentTool(BaseTool):
    name = "delegate_to_agent"
    description = (
        "Bir gorevi baska bir ajana devret. Hedef ajan tool'larini kullanarak "
        "gorevi icra eder ve cevabini doner. Hedef ajan zaten zincir icindeyse "
        "hata doner (cycle protection)."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "agent_id": {"type": "string", "description": "Hedef ajan id'si"},
            "prompt": {"type": "string", "description": "Hedef ajana verilecek talimat"},
            "max_steps": {"type": "integer", "default": 6},
            "validation_criteria": {
                "type": "string",
                "description": "(opsiyonel) Hedef ajanin ciktisinin uymasi gereken dogrulama kriterleri. Saglanmazsa otomatik kabul edilir."
            }
        },
        "required": ["agent_id", "prompt"]}

    async def _validate_output(self, provider: Any, criteria: str, output: str) -> tuple[bool, str]:
        from app.services.llm import ChatMessage
        import json
        import re
        
        sys_msg = (
            "Sen bir Ajan Cikti Dogrulayicisisin. Hedef ajanin verdigi yanitin, "
            "belirtilen dogrulama kriterlerini karsilayip karsilamadigini analiz et.\n"
            "Sadece asagidaki JSON formatinda yanit don, baska hicbir aciklama yapma:\n"
            "{\n"
            "  \"passed\": true veya false,\n"
            "  \"feedback\": \"Eger passed=false ise ajana iletilecek aciklayici duzeltme mesaji, passed=true ise bos\"\n"
            "}"
        )
        user_msg = (
            f"DOGRULEMA KRITERLERI:\n{criteria}\n\n"
            f"AJAN YANITI:\n{output}\n\n"
            "JSON yanit dondur."
        )
        try:
            resp = await provider.chat(
                [
                    ChatMessage(role="system", content=sys_msg),
                    ChatMessage(role="user", content=user_msg),
                ],
                temperature=0.1,
                max_tokens=400,
            )
            cleaned = resp.content.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*\n", "", cleaned)
                cleaned = re.sub(r"\n```\s*$", "", cleaned)
            data = json.loads(cleaned)
            return bool(data.get("passed", True)), str(data.get("feedback", ""))
        except Exception as exc:
            logger.warning("Ajan cikti dogrulama hatasi, varsayilan onay: %s", exc)
            return True, ""

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        target_id = (args.get("agent_id") or "").strip()
        prompt = (args.get("prompt") or "").strip()
        max_steps = int(args.get("max_steps", 6))
        validation_criteria = (args.get("validation_criteria") or "").strip()

        if not target_id:
            return ToolResult(ok=False, error="agent_id gerekli")
        if not prompt:
            return ToolResult(ok=False, error="prompt gerekli")
        if target_id == context.agent_id:
            return ToolResult(ok=False, error="Kendine delege edemezsin")

        # Cycle koruma
        chain: List[str] = list(context.extra.get("delegation_chain", []) or [])
        if target_id in chain:
            return ToolResult(
                ok=False,
                error=f"Delegasyon cyclesi: {' -> '.join(chain + [target_id])}",
            )
        if len(chain) >= 3:
            return ToolResult(
                ok=False,
                error="Maksimum delegasyon derinligi (3) asildi",
            )

        # Hedef ajani bul
        try:
            from app.services.agent_manager import agent_manager
            target_agent = agent_manager.require(target_id)
        except KeyError:
            return ToolResult(ok=False, error=f"Hedef ajan bulunamadi: {target_id}")
        if not target_agent.is_active:
            return ToolResult(ok=False, error=f"Hedef ajan aktif degil: {target_id}")

        # Run agent loop
        from app.services.agent_loop import run_agent_loop
        from app.services.tools.base import ToolContext as _Ctx
        from app.services.llm import get_provider, ChatMessage

        # Yeni context, chain'i guncelle
        new_extra = dict(context.extra)
        new_extra["delegation_chain"] = chain + [context.agent_id]
        
        # Blackboard nesnesini hazirla (yoksa olustur ve aktar)
        blackboard = new_extra.setdefault("blackboard", {})
        bb_summary = ", ".join(blackboard.keys()) if blackboard else "bos"
        prompt_with_bb = (
            f"{prompt}\n\n"
            f"[Bilgi: Ortak hafizada (Blackboard) su anahtarlar mevcut: {bb_summary}. "
            f"Gerekirse 'blackboard_get' veya 'blackboard_set' tool'larini kullanarak "
            f"diger ajanlarla veri paylasabilirsin.]"
        )
        
        target_ctx = _Ctx(
            agent_id=target_agent.id,
            agent_name=target_agent.name,
            workspace_dir=context.workspace_dir,
            extra=new_extra,
        )

        try:
            # Ilk deneme
            result = await run_agent_loop(
                target_agent,
                history=[],
                user_message=prompt_with_bb,
                max_steps=max_steps,
                parent_context=target_ctx,
            )
            
            # Dogrulama/Muzakere dongusu
            if validation_criteria and result.final_content:
                provider = get_provider(
                    target_agent.provider,
                    target_agent.model,
                    api_key=target_agent.api_key,
                    base_url=target_agent.base_url,
                )
                
                attempts = 0
                max_val_attempts = 2
                current_output = result.final_content
                
                val_history = [
                    ChatMessage(role="user", content=prompt_with_bb),
                    ChatMessage(role="assistant", content=current_output)
                ]
                
                while attempts < max_val_attempts:
                    passed, feedback = await self._validate_output(provider, validation_criteria, current_output)
                    if passed:
                        logger.info("Validation passed for delegated agent %s output", target_id)
                        result.final_content = current_output
                        break
                    
                    attempts += 1
                    logger.warning(
                        "Validation failed for agent %s. Attempt %d/%d. Feedback: %s",
                        target_id, attempts, max_val_attempts, feedback
                    )
                    
                    feedback_prompt = (
                        f"[OTOMATIK INCELEME HATASI]: Verdigin yanit dogrulama kriterlerini karsilayamadi.\n"
                        f"KRITERLER: {validation_criteria}\n"
                        f"HATA/GERI BILDIRIM: {feedback}\n"
                        f"Lutfen bu hatalari duzelterek cevabini guncelle."
                    )
                    
                    # Target ajani tekrar cagiriyoruz, gecmis sohbeti ve geri bildirimi ileterek
                    retry_result = await run_agent_loop(
                        target_agent,
                        history=val_history,
                        user_message=feedback_prompt,
                        max_steps=max_steps,
                        parent_context=target_ctx,
                    )
                    
                    current_output = retry_result.final_content or ""
                    val_history.append(ChatMessage(role="user", content=feedback_prompt))
                    val_history.append(ChatMessage(role="assistant", content=current_output))
                    
                    result.total_tokens = (result.total_tokens or 0) + (retry_result.total_tokens or 0)
                    result.steps += retry_result.steps
                    
                result.final_content = current_output

        except Exception as exc:
            logger.exception("delegate_to_agent run hatasi")
            return ToolResult(ok=False, error=f"Hedef ajan hatasi: {exc}")

        return ToolResult(
            ok=True,
            output=result.final_content or "(bos cevap)",
            data={
                "target_agent": target_id,
                "tool_calls": [tc.to_dict() for tc in result.tool_calls],
                "steps": result.steps,
                "tokens": result.total_tokens},
        )


class AgentWaitForApprovalTool(BaseTool):
    name = "agent_wait_for_approval"
    description = (
        "Bir gorevi veya kritik bir asamayi tamamladiginda kullanicidan onay ve geri bildirim talep eder. "
        "Kullanici onay verene kadar ajan loop'u duraklar. Kullanici onay verirse islem basariyla devam eder, "
        "reddedilirse veya geri bildirim yazarsa o geri bildirimi dondurur."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "reason": {
                "type": "string",
                "description": "Kullaniciya gosterilecek onay mesaji veya tamamlanan isin ozeti."
            }
        },
        "required": ["reason"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        reason = (args.get("reason") or "").strip()
        return ToolResult(
            ok=True,
            output=f"Kullanici onay verdi. Detaylar: {reason}",
            data={"reason": reason}
        )


class BlackboardSetTool(BaseTool):
    name = "blackboard_set"
    description = (
        "Paylasilan ortak hafizaya (Blackboard) bir veri yazar veya gunceller. "
        "Diger delege edilen ajanlar bu veriye blackboard_get ile erisebilir."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Kaydedilecek veri anahtari."},
            "value": {"type": "string", "description": "Kaydedilecek veri degeri (metin veya JSON)."}
        },
        "required": ["key", "value"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        key = (args.get("key") or "").strip()
        value = args.get("value") or ""
        if not key:
            return ToolResult(ok=False, error="key bos olamaz")
            
        blackboard = context.extra.setdefault("blackboard", {})
        blackboard[key] = value
        
        return ToolResult(
            ok=True,
            output=f"Blackboard'a kaydedildi: '{key}'",
            data={"key": key, "value": value}
        )


class BlackboardGetTool(BaseTool):
    name = "blackboard_get"
    description = (
        "Paylasilan ortak hafizadan (Blackboard) belirtilen anahtardaki veriyi okur."
    )
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {
            "key": {"type": "string", "description": "Okunacak veri anahtari."}
        },
        "required": ["key"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        key = (args.get("key") or "").strip()
        if not key:
            return ToolResult(ok=False, error="key bos olamaz")
            
        blackboard = context.extra.setdefault("blackboard", {})
        if key not in blackboard:
            return ToolResult(
                ok=False, 
                error=f"Blackboard'da '{key}' anahtari bulunamadi. Mevcut anahtarlar: {list(blackboard.keys())}"
            )
            
        value = blackboard[key]
        return ToolResult(
            ok=True,
            output=f"Blackboard['{key}'] = {value}",
            data={"key": key, "value": value}
        )