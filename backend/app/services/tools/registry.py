"""ToolRegistry: tum tool'lari kayit eder, izin filtresi uygular ve cagrir.

LLM'e gonderilen 'tools' listesi, agent'in AgentPermissions'una gore filtrelenir.
Mesela 'web_search=False' olan ajan 'web_search' tool'unu goremez.
"""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from app.schemas.agent import AgentPermissions
from app.services.tools.base import BaseTool, PermissionKey, ToolContext, ToolResult
import importlib
import pkgutil
import inspect

def _auto_discover_tools() -> list:
    """tools/ klasoerundeki tum BaseTool alt siniflarini otomatik kesfeder."""
    from app.services.tools.base import BaseTool
    package = importlib.import_module("app.services.tools")
    tools = []
    for _, module_name, _ in pkgutil.iter_modules(package.__path__):
        if module_name.startswith("_") or module_name in ("registry", "base"):
            continue
        try:
            module = importlib.import_module(f"app.services.tools.{module_name}")
            # Check for feature flag
            if getattr(module, '_FEATURE_ENABLED', True) is False:
                logger.info("Tool modulu devre disi: %s", module_name)
                continue
            for name, cls in inspect.getmembers(module, inspect.isclass):
                if (
                    issubclass(cls, BaseTool)
                    and cls is not BaseTool
                    and not getattr(cls, '_abstract', False)
                    and hasattr(cls, 'name')
                    and cls.name  # name must be non-empty
                ):
                    try:
                        tools.append(cls())
                    except Exception as exc:
                        logger.warning("Tool olusturulamadi %s.%s: %s", module_name, name, exc)
        except Exception as exc:
            logger.warning("Tool modulu yuklenemedi %s: %s", module_name, exc)
    return tools

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Singleton-benzeri kayit defteri."""

    def __init__(self) -> None:
        self._tools: Dict[str, BaseTool] = {}
        self._register_defaults()

    def _register_defaults(self) -> None:
        defaults = _auto_discover_tools()
        for t in defaults:
            self.register(t)

    def register(self, tool: BaseTool) -> None:
        if tool.name in self._tools:
            logger.warning("Tool zaten kayitli, uzerine yaziliyor: %s", tool.name)
        self._tools[tool.name] = tool

    def unregister(self, tool_name: str) -> bool:
        """Remove a tool by name. Returns True if it existed."""
        removed = self._tools.pop(tool_name, None)
        if removed:
            logger.info("Tool kaldırıldı: %s", tool_name)
        return removed is not None

    def get(self, name: str) -> Optional[BaseTool]:
        return self._tools.get(name)

    def all(self) -> List[BaseTool]:
        return list(self._tools.values())

    # ---------- Izin filtresi ----------

    @staticmethod
    def _is_permitted(perm: PermissionKey, perms: AgentPermissions) -> bool:
        if perm == "none":
            return True
        return bool(getattr(perms, perm, False))

    def filter_for_agent(self, perms: AgentPermissions) -> List[BaseTool]:
        return [t for t in self._tools.values() if self._is_permitted(t.permission, perms)]

    def openai_schemas(self, perms: AgentPermissions, provider_name: str = "openai") -> List[Dict[str, Any]]:
        # Groq'un ucretsiz katmanindaki cok dar TPM (12000 tokens/dakika) limiti nedeniyle tool sayisini 30 ile kısıtlayalım.
        # Bu, her istekte devasa sema yukunu engeller.
        schemas = [t.to_openai_schema() for t in self.filter_for_agent(perms)]
        limit = 30 if provider_name.lower() == "groq" else 128
        return schemas[:limit]

    def anthropic_schemas(self, perms: AgentPermissions) -> List[Dict[str, Any]]:
        schemas = [t.to_anthropic_schema() for t in self.filter_for_agent(perms)]
        return schemas[:128]

    # ---------- Calistirma ----------

    async def execute(
        self,
        name: str,
        args: Dict[str, Any],
        perms: AgentPermissions,
        context: ToolContext,
        timeout: float = 60.0,
    ) -> ToolResult:
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(ok=False, error=f"Bilinmeyen tool: {name}")
        if not self._is_permitted(tool.permission, perms):
            return ToolResult(
                ok=False,
                error=f"'{name}' icin izin yok ({tool.permission}). Kullanici ayarlardan izin vermeli.",
            )

        # ============ HITL Approval kontrolu (FAZ 1.5) ============
        try:
            from app.services.approval_service import (
                approval_service,
                requires_approval,
            )
            if requires_approval(name, args):
                approved, reason = await approval_service.request_approval(
                    agent_id=context.agent_id,
                    tool_name=name,
                    arguments=args,
                    conversation_id=getattr(context, "conversation_id", None) or context.extra.get("conversation_id"),
                    plan_id=context.extra.get("plan_id"),
                    step_id=context.extra.get("step_id"),
                )
                if not approved:
                    return ToolResult(
                        ok=False,
                        error=f"Kullanici onayi alinamadi: {reason}",
                    )
        except Exception as exc:  # pragma: no cover
            logger.warning("Approval kontrolu hatasi (gecildi): %s", exc)
        # ============ /HITL ============

        # ============ Sandbox kontrolu (FAZ 7.1) ============
        try:
            from app.services.security.sandbox import check_sandbox
            sandbox_ok, sandbox_err = check_sandbox(name, args)
            if not sandbox_ok:
                return ToolResult(ok=False, error=f"Sandbox: {sandbox_err}")
        except ImportError:
            pass  # sandbox modulu yoksa atla
        except Exception as exc:  # pragma: no cover
            logger.warning("Sandbox kontrolu hatasi (gecildi): %s", exc)
        # ============ /Sandbox ============

        try:
            result = await asyncio.wait_for(tool.execute_safe(args, context), timeout=timeout)
        except asyncio.TimeoutError:
            result = ToolResult(ok=False, error=f"Tool zaman asimi: {name} ({timeout}s)")
        except Exception as exc:
            logger.exception("Tool calistirma hatasi: %s", name)
            result = ToolResult(ok=False, error=f"Tool hatasi: {exc}")

        # ============ Smart Error Routing ============
        if not result.ok and result.error:
            err_lower = result.error.lower()
            hint = ""
            if "not found" in err_lower or "bulunamadi" in err_lower:
                if "file" in err_lower or "dosya" in err_lower or name in ["read_file", "write_file", "delete_file"]:
                    hint = " İpucu: Dosya adını veya yolunu yanlış yazmış olabilirsin. Klasördeki mevcut dosyaları görmek için 'list_dir' aracını kullanmayı dene."
            elif "timeout" in err_lower or "zaman asimi" in err_lower:
                hint = " İpucu: İşlem çok uzun sürdü. Tekrar denemeyi veya isteği daha küçük parçalara bölmeyi (örneğin daha spesifik bir arama yapmayı) düşünebilirsin."
            elif "permission" in err_lower or "izin" in err_lower or "denied" in err_lower:
                hint = " İpucu: Yetki hatası. İşletim sisteminde veya hedef serviste gerekli izinlere sahip olmayabilirsin."
            elif "json parse" in err_lower or "invalid argument" in err_lower:
                hint = " İpucu: Araç argümanlarını (JSON) oluştururken bir format hatası yaptın. Lütfen araca gönderdiğin JSON yapısını kontrol edip düzelt."
                
            if hint:
                result.error = result.error + hint
        # ============================================

        # ============ Audit log (FAZ 1.6) ============
        try:
            from app.services.audit import audit_chain
            await audit_chain.append(
                event_type="tool_executed",
                payload={
                    "tool": name,
                    "arguments": args,
                    "ok": result.ok,
                    "error": result.error,
                    "output_preview": (result.output or "")[:200]},
                agent_id=context.agent_id,
            )
        except Exception as exc:  # pragma: no cover
            logger.warning("Audit yazma hatasi: %s", exc)
        # ============ /Audit ============

        return result


# Singleton
tool_registry = ToolRegistry()