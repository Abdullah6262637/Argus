"""MCP (Model Context Protocol) bridge - external MCP server'lardan tool import.

Konfigurasyon dosyasi: backend/agents/mcp_servers.yaml
Format:
    servers:
      - name: filesystem
        command: ["npx", "-y", "@modelcontextprotocol/server-filesystem", "/path"]
        env: {}            # opsiyonel
        enabled: true      # opsiyonel
        timeout: 120       # opsiyonel (saniye)
      - name: github
        command: ["python", "-m", "mcp_github"]
        env:
          GITHUB_TOKEN: ${GITHUB_TOKEN}   # os.environ'dan interpolasyon

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
import re
from contextlib import AsyncExitStack
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)

_ENV_VAR_PATTERN = re.compile(r"\$\{([^}]+)\}")


def _interpolate_env(value: str) -> str:
    """Resolve ${VAR_NAME} placeholders from os.environ.

    If the env var is not set, return an empty string rather than
    passing the raw '${VAR}' literal to the subprocess.
    """
    def _replace(match: re.Match) -> str:
        var_name = match.group(1)
        resolved = os.environ.get(var_name, "")
        if not resolved:
            logger.warning("MCP env var '%s' bulunamadı (os.environ'da yok)", var_name)
        return resolved

    return _ENV_VAR_PATTERN.sub(_replace, value)


@dataclass
class ServerState:
    """Runtime state for a single MCP server connection."""
    name: str
    session: Any = None
    exit_stack: Optional[AsyncExitStack] = None
    tool_names: List[str] = field(default_factory=list)
    status: str = "disconnected"  # disconnected | connecting | connected | error
    error_message: Optional[str] = None
    connected_at: Optional[datetime] = None
    tool_count: int = 0


class MCPProxyTool(BaseTool):
    """MCP server'dan import edilen bir tool icin proxy."""

<<<<<<< HEAD
=======
    permission = "none"

>>>>>>> 31b48af (perf(core): optimize GPU rasterization, eliminate CSS blur lag, optimize RAF scroll and SQLite memory I/O)
    def __init__(
        self,
        server_name: str,
        tool_name: str,
        description: str,
        schema: Dict[str, Any],
        bridge: "MCPBridge",
        timeout: float = 120.0,
    ) -> None:
        self.name = f"mcp_{server_name}_{tool_name}"
        self.description = f"[MCP:{server_name}] {description}"
        self.parameters = schema or {"type": "object", "properties": {}, "required": []}
        self._server_name = server_name
        self._mcp_tool_name = tool_name
        self._bridge = bridge
        self._timeout = timeout

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
        state = self._bridge.get_server_state(self._server_name)
        if state is None or state.session is None:
            return ToolResult(
                ok=False,
                error=f"MCP server '{self._server_name}' bağlantı aktif değil",
            )
        try:
            result = await asyncio.wait_for(
                state.session.call_tool(self._mcp_tool_name, args),
                timeout=self._timeout,
            )
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
        except asyncio.TimeoutError:
            return ToolResult(
                ok=False,
                error=f"MCP tool '{self._mcp_tool_name}' zaman aşımına uğradı ({self._timeout}s)",
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"MCP çağrı hatası: {exc}")


class MCPBridge:
    def __init__(self) -> None:
        self._servers: Dict[str, ServerState] = {}
        self._available: Optional[bool] = None
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

    def get_server_state(self, server_name: str) -> Optional[ServerState]:
        return self._servers.get(server_name)

    def get_session(self, server_name: str) -> Optional[Any]:
        """Backward compat: return session directly."""
        state = self._servers.get(server_name)
        return state.session if state else None

    @property
    def registered_tool_names(self) -> List[str]:
        names: List[str] = []
        for state in self._servers.values():
            names.extend(state.tool_names)
        return names

    def get_status_all(self) -> List[Dict[str, Any]]:
        """Return health/status info for all known servers."""
        result: List[Dict[str, Any]] = []
        for state in self._servers.values():
            result.append({
                "name": state.name,
                "status": state.status,
                "tool_count": state.tool_count,
                "error": state.error_message,
                "connected_at": state.connected_at.isoformat() if state.connected_at else None,
            })
        return result

    def _load_config(self) -> List[Dict[str, Any]]:
        path = self.config_path
        if not path.exists():
            return []
        try:
            with path.open("r", encoding="utf-8") as f:
                data = yaml.safe_load(f) or {}
            return data.get("servers", []) or []
        except Exception as exc:
            logger.warning("MCP config okuma hatası: %s", exc)
            return []

    def _resolve_env(self, env_extra: Dict[str, Any]) -> Dict[str, str]:
        """Build full environment with ${VAR} interpolation."""
        full_env = dict(os.environ)
        for key, value in env_extra.items():
            str_key = str(key)
            str_val = str(value)
            resolved = _interpolate_env(str_val)
            full_env[str_key] = resolved
        return full_env

    async def _connect_one(self, srv: Dict[str, Any]) -> None:
        """Connect to a single MCP server and import its tools."""
        try:
            from mcp import ClientSession, StdioServerParameters  # type: ignore
            from mcp.client.stdio import stdio_client  # type: ignore
        except ImportError as exc:
            logger.warning("mcp paketi import edilemedi: %s", exc)
            return

        name = srv.get("name") or "mcp"
        command = srv.get("command") or []
        env_extra = srv.get("env") or {}
        timeout = float(srv.get("timeout", 120))

        if not command or not isinstance(command, list):
            logger.warning("MCP server '%s' için geçerli command yok", name)
            return

        state = ServerState(name=name, status="connecting")
        self._servers[name] = state

        full_env = self._resolve_env(env_extra)

        # Check for unresolved API keys (empty after interpolation)
        missing_keys = [
            k for k, v in env_extra.items()
            if _ENV_VAR_PATTERN.search(str(v)) and not full_env.get(str(k))
        ]
        if missing_keys:
            msg = f"MCP server '{name}' için eksik env var: {', '.join(missing_keys)}"
            logger.warning(msg)
            state.status = "error"
            state.error_message = msg
            return

        params = StdioServerParameters(
            command=command[0],
            args=command[1:],
            env=full_env,
        )

        exit_stack = None
        try:
            exit_stack = AsyncExitStack()
            await exit_stack.__aenter__()

            stdio_transport = await exit_stack.enter_async_context(
                stdio_client(params)
            )
            read_stream, write_stream = stdio_transport
            session = await exit_stack.enter_async_context(
                ClientSession(read_stream, write_stream)
            )
            await asyncio.wait_for(session.initialize(), timeout=30.0)

            state.session = session
            state.exit_stack = exit_stack
            state.connected_at = datetime.now(UTC)
            logger.info("MCP server bağlandı: %s", name)

            # Import tools into registry
            try:
                from app.services.tools.registry import tool_registry
                tools_resp = await asyncio.wait_for(
                    session.list_tools(), timeout=15.0
                )
                tool_count = 0
                for t in getattr(tools_resp, "tools", []) or []:
                    proxy = MCPProxyTool(
                        server_name=name,
                        tool_name=t.name,
                        description=getattr(t, "description", "") or "",
                        schema=getattr(t, "inputSchema", None) or {},
                        bridge=self,
                        timeout=timeout,
                    )
                    tool_registry.register(proxy)
                    state.tool_names.append(proxy.name)
                    tool_count += 1
                state.tool_count = tool_count
                state.status = "connected"
                logger.info("MCP server '%s' → %d tool import edildi", name, tool_count)
            except Exception as exc:
                logger.warning("MCP tool listesi alınamadı (%s): %s", name, exc)
                state.status = "connected"
                state.error_message = f"Tool listesi alınamadı: {exc}"

        except asyncio.TimeoutError:
            msg = f"MCP server '{name}' bağlantı zaman aşımı (30s)"
            logger.warning(msg)
            state.status = "error"
            state.error_message = msg
            if exit_stack:
                try:
                    await exit_stack.aclose()
                except Exception:
                    pass
        except Exception as exc:
            msg = f"MCP server '{name}' bağlantı hatası: {exc}"
            logger.warning(msg)
            state.status = "error"
            state.error_message = str(exc)
            if exit_stack:
                try:
                    await exit_stack.aclose()
                except Exception:
                    pass

    async def _disconnect_one(self, name: str) -> None:
        """Gracefully disconnect a single MCP server."""
        state = self._servers.get(name)
        if not state:
            return

        # Unregister tools
        try:
            from app.services.tools.registry import tool_registry
            for tool_name in state.tool_names:
                tool_registry.unregister(tool_name)
        except Exception as exc:
            logger.warning("MCP tool unregister hatası (%s): %s", name, exc)

        # Close connection
        if state.exit_stack:
            try:
                await state.exit_stack.aclose()
            except Exception as exc:
                logger.warning("MCP exit_stack close hatası (%s): %s", name, exc)

        state.session = None
        state.exit_stack = None
        state.tool_names.clear()
        state.tool_count = 0
        state.status = "disconnected"
        state.error_message = None
        state.connected_at = None
        logger.info("MCP server '%s' bağlantısı kesildi", name)

    async def connect_server(self, server_name: str) -> Dict[str, Any]:
        """Hot-connect a single server by name. Called from the API router."""
        if not self.available:
            return {"ok": False, "error": "MCP SDK kurulu değil (pip install mcp)"}

        async with self._lock:
            # If already connected, disconnect first
            if server_name in self._servers and self._servers[server_name].status == "connected":
                await self._disconnect_one(server_name)

            # Find config for this server
            all_servers = self._load_config()
            srv_config = next((s for s in all_servers if s.get("name") == server_name), None)
            if not srv_config:
                return {"ok": False, "error": f"Server '{server_name}' konfigürasyonda bulunamadı"}

            await self._connect_one(srv_config)

            state = self._servers.get(server_name)
            if state and state.status == "connected":
                return {
                    "ok": True,
                    "tool_count": state.tool_count,
                    "tools": state.tool_names,
                }
            error_msg = state.error_message if state else "Bilinmeyen hata"
            return {"ok": False, "error": error_msg}

    async def disconnect_server(self, server_name: str) -> Dict[str, Any]:
        """Hot-disconnect a single server by name. Called from the API router."""
        async with self._lock:
            if server_name not in self._servers:
                return {"ok": True, "message": "Zaten bağlı değil"}
            await self._disconnect_one(server_name)
            return {"ok": True}

    async def connect_all(self) -> None:
        """Connect all enabled MCP servers (called during app lifespan)."""
        if not self.available:
            logger.info("MCP SDK kurulu değil; bridge atlandı (pip install mcp)")
            return

        all_servers = self._load_config()
        enabled = [s for s in all_servers if s.get("enabled", True)]

        if not enabled:
            logger.info("MCP konfigürasyonu boş veya aktif server yok")
            return

        async with self._lock:
            for srv in enabled:
                await self._connect_one(srv)

    async def shutdown(self) -> None:
        """Disconnect all servers (called during app shutdown)."""
        async with self._lock:
            for name in list(self._servers.keys()):
                await self._disconnect_one(name)
            self._servers.clear()


# Singleton
mcp_bridge = MCPBridge()