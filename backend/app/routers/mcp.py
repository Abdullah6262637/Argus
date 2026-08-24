"""/api/mcp router - MCP servers yönetimi (hot-reload destekli)."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
import yaml

from app.config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mcp", tags=["mcp"])


class McpServerInfo(BaseModel):
    """MCP server bilgisi."""
    name: str
    enabled: bool
    command: List[str] = Field(default_factory=list)
    args: List[str] = Field(default_factory=list)
    env: Dict[str, str] = Field(default_factory=dict)
    description: Optional[str] = None
    timeout: Optional[float] = None


class McpServerStatus(BaseModel):
    """MCP server runtime durum bilgisi."""
    name: str
    config_enabled: bool
    runtime_status: str  # disconnected | connecting | connected | error
    tool_count: int = 0
    error: Optional[str] = None
    connected_at: Optional[str] = None
    description: Optional[str] = None
    command: List[str] = Field(default_factory=list)


class McpServersResponse(BaseModel):
    """MCP servers listesi response."""
    servers: List[McpServerStatus]


class ToggleMcpRequest(BaseModel):
    """MCP server toggle request."""
    enabled: bool


class ToggleMcpResponse(BaseModel):
    """MCP server toggle response."""
    ok: bool
    server_name: str
    enabled: bool
    message: str
    tool_count: int = 0
    tools: List[str] = Field(default_factory=list)
    error: Optional[str] = None


async def _read_file_async(path) -> str:
    """Async file read using asyncio."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, lambda: path.read_text(encoding="utf-8"))


async def _write_file_async(path, content: str) -> None:
    """Async file write using asyncio."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, lambda: path.write_text(content, encoding="utf-8"))


@router.get("/servers", response_model=McpServersResponse)
async def list_mcp_servers() -> McpServersResponse:
    """MCP servers listesini config + runtime durumu ile döndür."""
    try:
        from app.services.mcp.bridge import mcp_bridge

        config_path = get_settings().backend_dir / "agents" / "mcp_servers.yaml"
        if not config_path.exists():
            return McpServersResponse(servers=[])

        content = await _read_file_async(config_path)
        data = yaml.safe_load(content) or {}
        servers_raw = data.get("servers", []) or []

        # Merge config with runtime status
        runtime_statuses = {s["name"]: s for s in mcp_bridge.get_status_all()}

        result: List[McpServerStatus] = []
        for srv in servers_raw:
            name = srv.get("name", "")
            runtime = runtime_statuses.get(name, {})
            result.append(McpServerStatus(
                name=name,
                config_enabled=srv.get("enabled", True),
                runtime_status=runtime.get("status", "disconnected"),
                tool_count=runtime.get("tool_count", 0),
                error=runtime.get("error"),
                connected_at=runtime.get("connected_at"),
                description=srv.get("description", ""),
                command=srv.get("command", []),
            ))
        return McpServersResponse(servers=result)
    except Exception as exc:
        logger.exception("MCP servers okuma hatası")
        raise HTTPException(500, f"MCP config okuma hatası: {exc}")


@router.post("/servers/{server_name}/toggle", response_model=ToggleMcpResponse)
async def toggle_mcp_server(server_name: str, payload: ToggleMcpRequest) -> ToggleMcpResponse:
    """Bir MCP server'ın enabled durumunu değiştir ve hot-reload uygula."""
    try:
        from app.services.mcp.bridge import mcp_bridge

        enabled = payload.enabled

        config_path = get_settings().backend_dir / "agents" / "mcp_servers.yaml"
        if not config_path.exists():
            raise HTTPException(404, "mcp_servers.yaml bulunamadı")

        content = await _read_file_async(config_path)
        data = yaml.safe_load(content) or {}

        servers: List[Dict[str, Any]] = data.get("servers", [])
        found = False
        for srv in servers:
            if srv.get("name") == server_name:
                srv["enabled"] = enabled
                found = True
                break

        if not found:
            raise HTTPException(404, f"Server '{server_name}' bulunamadı")

        # Save config
        yaml_content = yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
        await _write_file_async(config_path, yaml_content)
        logger.info("MCP server '%s' enabled=%s olarak güncellendi", server_name, enabled)

        # Hot-reload: connect or disconnect immediately
        tool_count = 0
        tools: List[str] = []
        error_msg: Optional[str] = None

        if enabled:
            result = await mcp_bridge.connect_server(server_name)
            if result.get("ok"):
                tool_count = result.get("tool_count", 0)
                tools = result.get("tools", [])
                message = f"'{server_name}' bağlandı ve {tool_count} araç yüklendi."
            else:
                error_msg = result.get("error", "Bilinmeyen hata")
                message = f"'{server_name}' etkinleştirildi ancak bağlantı hatası: {error_msg}"
        else:
            await mcp_bridge.disconnect_server(server_name)
            message = f"'{server_name}' devre dışı bırakıldı ve bağlantısı kesildi."

        return ToggleMcpResponse(
            ok=error_msg is None,
            server_name=server_name,
            enabled=enabled,
            message=message,
            tool_count=tool_count,
            tools=tools,
            error=error_msg,
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("MCP server toggle hatası")
        raise HTTPException(500, f"Toggle hatası: {exc}")


@router.get("/servers/{server_name}/status")
async def get_mcp_server_status(server_name: str) -> Dict[str, Any]:
    """Tek bir MCP server'ın runtime durumunu getir."""
    from app.services.mcp.bridge import mcp_bridge

    state = mcp_bridge.get_server_state(server_name)
    if state is None:
        return {
            "name": server_name,
            "status": "disconnected",
            "tool_count": 0,
            "error": None,
        }
    return {
        "name": state.name,
        "status": state.status,
        "tool_count": state.tool_count,
        "tools": state.tool_names,
        "error": state.error_message,
        "connected_at": state.connected_at.isoformat() if state.connected_at else None,
    }