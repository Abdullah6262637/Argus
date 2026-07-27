"""Güvenlik ve İzolasyon İyileştirmeleri Testleri (Faz 0 & 1)."""
from __future__ import annotations

import pytest
from app.services.tools.code_tools import PythonEvalTool
from app.services.tools.agent_tools import DelegateToAgentTool
from app.services.mcp.bridge import MCPProxyTool
from app.services.tools.base import ToolContext


@pytest.mark.asyncio
async def test_python_eval_ast_sandbox_breakout_blocked():
    tool = PythonEvalTool()
    assert tool.permission == "system_admin"
    assert tool.requires_confirmation is True

    ctx = ToolContext(agent_id="test", workspace_dir=".")
    
    # Dunder subclass traversal denemesi
    res = await tool.execute({"code": "().__class__.__bases__[0].__subclasses__()"}, ctx)
    assert not res.ok or "SecurityError" in res.output or "HATA" in res.output

    # Dangerous built-in eval/exec denemesi
    res2 = await tool.execute({"code": "eval('1+1')"}, ctx)
    assert not res2.ok or "SecurityError" in res2.output or "HATA" in res2.output


@pytest.mark.asyncio
async def test_delegate_to_agent_privilege_escalation():
    from app.services.agent_manager import agent_manager, Agent

    # Düşük yetkili ajanı kaydet
    low_agent = Agent(
        id="low-priv-agent",
        name="Low Priv Agent",
        permissions={"web_search": True, "terminal_cmd": False, "system_admin": False}
    )
    # Yüksek yetkili ajanı kaydet
    high_agent = Agent(
        id="high-priv-agent",
        name="High Priv Agent",
        permissions={"web_search": True, "terminal_cmd": True, "system_admin": True}
    )

    agent_manager._agents["low-priv-agent"] = low_agent
    agent_manager._agents["high-priv-agent"] = high_agent

    tool = DelegateToAgentTool()
    ctx = ToolContext(agent_id="low-priv-agent", workspace_dir=".")

    res = await tool.execute({
        "agent_id": "high-priv-agent",
        "prompt": "Sistem komutları çalıştır"
    }, ctx)

    assert not res.ok
    assert "Yetki Yükseltme Engellendi" in res.error


def test_mcp_proxy_tool_permissions():
    proxy_fs = MCPProxyTool("filesystem", "read_file", "Read file", {}, None)
    assert proxy_fs.permission == "file_system"
    assert proxy_fs.requires_confirmation is True

    proxy_term = MCPProxyTool("terminal", "execute", "Run command", {}, None)
    assert proxy_term.permission == "terminal_cmd"
    assert proxy_term.requires_confirmation is True

    proxy_search = MCPProxyTool("search", "query", "Search web", {}, None)
    assert proxy_search.permission == "web_search"
    assert proxy_search.requires_confirmation is False
