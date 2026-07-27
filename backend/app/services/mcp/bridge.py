"""MCP (Model Context Protocol) bridge - external MCP server'lardan tool import.

Konfigurasyon dosyasi: backend/agents/mcp_servers.yaml
Format:
    servers:
      - name: filesystem
        command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path"]
        env: {}            # opsiyonel
        enabled: true      # opsiyonel
      - name: github
        command: ["python", "-m", "mcp_github"]
        env:
          GITHUB_TOKEN: "ghp_..."

Kullanim:
    await mcp_bridge.connect_all()  # lifespan'de
    await mcp_bridge.shutdown()     # kapanista

Tool'lar otomatik olarak ToolRegistry'ye 'mcp_<server>_<tool>' adiyla kayit edilir.
Implementasyon `mcp` Python SDK'sina dayanir; paket yoksa try/except ile atlanir.
"""
from __future__ import annotations

import asyncio
import logging
import os
from contextlib import AsyncExitStack
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class MCPProxyTool(BaseTool):
    """MCP server'dan import edilen bir tool icin proxy."""

    def __init__(
        self,
        server_name: str,
        tool_name: str,
        description: str,
        schema: Dict[str, Any],
        bridge: "MCPBridge",
    ) -> None:
        self.name = f"mcp_{server_name}_{tool_name}"
        self.description = f"[MCP:{server_name}] {description}"
        self.parameters = schema or {"type": "object", "properties": {}, "required": []}
        self._server_name = server_name
        self._mcp_tool_name = tool_name
        self._bridge = bridge

        # Güvenlik: MCP araçları için sunucu tipine göre uygun izin seviyeleri belirle
        if server_name in ("filesystem", "sqlite"):
            self.permission = "file_system"
            self.requires_confirmation = True
        elif server_name in ("terminal", "shell", "bash"):
            self.permission = "terminal_cmd"
            self.requires_confirmation = True
        else:
            self.permission = "web_search"
            self.requires_confirmation = False

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        session = self._bridge.get_session(self._server_name)
        if session is None:
            return ToolResult(
                ok=False,
                error=f"MCP server '{self._server_name}' baglanti aktif degil",
            )
        try:
            result = await session.call_tool(self._mcp_tool_name, args)
            text_parts: List[str] = []
            data: Dict[str, Any] = {"server": self._server_name}
            for c in getattr(result, "content", []) or []:
                t = getattr(c, "type", "") or getattr(c, "kind", "")
                if t == "text" or hasattr(c, "text"):
                    text_parts.append(getattr(c, "text", "") or "")
                elif t == "image":
                    data["has_image"] = True
                    img_data = getattr(c, "data", None)
                    if img_data:
                        data["imageBase64"] = img_data
            if not text_parts:
                text_parts.append(str(result))
            return ToolResult(
                ok=not getattr(result, "isError", False),
                output="\n".join(text_parts),
                data=data,
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"MCP cagri hata: {exc}")


class MCPBridge:
    def __init__(self) -> None:
        self._sessions: Dict[str, Any] = {}
        self._tool_names: List[str] = []
        self._available: Optional[bool] = None
        self._exit_stack: Optional[AsyncExitStack] = None
        self._lock = asyncio.Lock()

    @property
    def available(self) -> bool:
        if self._available is None:
            try:
                import mcp  # noqa: F401
                self._available = True
            except ImportError:
                self._available = False
        return self._available

    @property
    def config_path(self) -> Path:
        from app.config import get_settings
        return get_settings().backend_dir / "agents" / "mcp_servers.yaml"

    def get_session(self, server_name: str) -> Optional[Any]:
        return self._sessions.get(server_name)

    @property
    def registered_tool_names(self) -> List[str]:
        return list(self._tool_names)

    def _load_config(self) -> List[Dict[str, Any]]:
        path = self.config_path
        if not path.exists():
            return []
        try:
            with path.open("r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            servers = data.get("servers", []) or []
            # Filtre: enabled=False olanlari atla
            return [s for s in servers if s.get("enabled", True)]
        except Exception as exc:
            logger.warning("MCP config okuma hatasi: %s", exc)
            return []

    async def _connect_one(self, srv: Dict[str, Any]) -> None:
        """Tek bir MCP server'a baglan ve tool'larini import et."""
        try:
            from mcp import ClientSession, StdioServerParameters  # type: ignore
            from mcp.client.stdio import stdio_client  # type: ignore
        except ImportError as exc:
            logger.warning("mcp paketi import edilemedi: %s", exc)
            return

        name = srv.get("name") or "mcp"
        command = srv.get("command") or []
        env_extra = srv.get("env") or {}

        if not command or not isinstance(command, list):
            logger.warning("MCP server '%s' icin gecerli command yok", name)
            return

        if name in self._sessions:
            logger.info("MCP server '%s' zaten bagli", name)
            return

        # Env: mevcut env + ek
        full_env = {**os.environ, **{str(k): str(v) for k, v in env_extra.items()}}

        params = StdioServerParameters(
            command=command[0],
            args=command[1:],
            env=full_env,
        )

        try:
            assert self._exit_stack is not None
            stdio_transport = await self._exit_stack.enter_async_context(
                stdio_client(params)
            )
            read_stream, write_stream = stdio_transport
            session = await self._exit_stack.enter_async_context(
                ClientSession(read_stream, write_stream)
            )
            await session.initialize()
            self._sessions[name] = session
            logger.info("MCP server bagli: %s", name)

            # Tool listesini cek ve registry'ye ekle
            try:
                from app.services.tools.registry import tool_registry
                tools_resp = await session.list_tools()
                tool_count = 0
                for t in getattr(tools_resp, "tools", []) or []:
                    proxy = MCPProxyTool(
                        server_name=name,
                        tool_name=t.name,
                        description=getattr(t, "description", "") or "",
                        schema=getattr(t, "inputSchema", None) or {},
                        bridge=self,
                    )
                    tool_registry.register(proxy)
                    self._tool_names.append(proxy.name)
                    tool_count += 1
                logger.info("MCP server '%s' icinden %d tool import edildi", name, tool_count)
            except Exception as exc:
                logger.warning("MCP tool listesi alinamadi (%s): %s", name, exc)
        except Exception as exc:
            logger.warning("MCP server '%s' baglanti hatasi: %s", name, exc)

    async def connect_all(self) -> None:
        """Tum tanimli MCP server'lara baglan ve tool'larini import et."""
        if not self.available:
            logger.info("MCP SDK kurulu degil; bridge atlandi (pip install mcp)")
            return

        servers = self._load_config()
        if not servers:
            logger.info("MCP konfigurasyonu bos veya yok")
            return

        async with self._lock:
            if self._exit_stack is None:
                self._exit_stack = AsyncExitStack()
                await self._exit_stack.__aenter__()

            for srv in servers:
                await self._connect_one(srv)

    async def shutdown(self) -> None:
        async with self._lock:
            self._sessions.clear()
            self._tool_names.clear()
            if self._exit_stack is not None:
                try:
                    await self._exit_stack.aclose()
                except Exception as exc:  # pragma: no cover
                    logger.warning("MCP exit_stack aclose hata: %s", exc)
                self._exit_stack = None


# Singleton
mcp_bridge = MCPBridge()