"""/api/mcp router - MCP servers yönetimi."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List

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


class McpServersResponse(BaseModel):
    """MCP servers listesi response."""
    servers: List[McpServerInfo]


class ToggleMcpRequest(BaseModel):
    """MCP server toggle request."""
    enabled: bool


class ToggleMcpResponse(BaseModel):
    """MCP server toggle response."""
    ok: bool
    server_name: str
    enabled: bool
    message: str


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
    """MCP servers listesini döndür (mcp_servers.yaml'dan)."""
    try:
        config_path = get_settings().backend_dir / "agents" / "mcp_servers.yaml"
        if not config_path.exists():
            return McpServersResponse(servers=[])
        
        content = await _read_file_async(config_path)
        data = yaml.safe_load(content) or {}
        
        servers_raw = data.get("servers", [])
        servers = [McpServerInfo(**srv) for srv in servers_raw]
        return McpServersResponse(servers=servers)
    except Exception as exc:
        logger.exception("MCP servers okuma hatasi")
        raise HTTPException(500, f"MCP config okuma hatasi: {exc}")


@router.post("/servers/{server_name}/toggle", response_model=ToggleMcpResponse)
async def toggle_mcp_server(server_name: str, payload: ToggleMcpRequest) -> ToggleMcpResponse:
    """Bir MCP server'ın enabled durumunu değiştir."""
    try:
        enabled = payload.enabled
        
        config_path = get_settings().backend_dir / "agents" / "mcp_servers.yaml"
        if not config_path.exists():
            raise HTTPException(404, "mcp_servers.yaml bulunamadi")
        
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
            raise HTTPException(404, f"Server '{server_name}' bulunamadi")
        
        # Dosyayı yaz
        yaml_content = yaml.safe_dump(data, allow_unicode=True, sort_keys=False)
        await _write_file_async(config_path, yaml_content)
        
        logger.info("MCP server '%s' enabled=%s olarak güncellendi", server_name, enabled)
        
        return ToggleMcpResponse(
            ok=True,
            server_name=server_name,
            enabled=enabled,
            message=f"Server '{server_name}' {'etkinleştirildi' if enabled else 'devre dışı bırakıldı'}. Değişikliklerin etkili olması için backend'i yeniden başlatın."
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("MCP server toggle hatasi")
        raise HTTPException(500, f"Toggle hatasi: {exc}")