"""ToolRegistry birim testleri: izin filtresi, schema uretimi, basit calistirma."""
from __future__ import annotations

import pytest

from app.schemas.agent import AgentPermissions
from app.services.tools.base import ToolContext
from app.services.tools.registry import tool_registry


def test_registry_has_core_tools() -> None:
    names = {t.name for t in tool_registry.all()}
    expected_core = {
        "read_file",
        "write_file",
        "list_dir",
        "system_info",
        "screenshot",
        "web_search",
        "open_url"}
    missing = expected_core - names
    assert not missing, f"Eksik core tool'lar: {missing}"


def test_registry_has_v3_tools() -> None:
    """v3 Sprint 3 tool'lari registry'de olmali."""
    names = {t.name for t in tool_registry.all()}
    v3_tools = {
        "git_clone",
        "git_status",
        "git_commit",
        "email_send",
        "db_query",
        "image_generate",
        "pdf_generate",
        "slack_send",
        "discord_send",
        "telegram_send"}
    missing = v3_tools - names
    assert not missing, f"v3 tool'lari eksik: {missing}"


def test_permission_filter_blocks_disabled() -> None:
    perms = AgentPermissions(
        file_system=False, terminal_cmd=False, web_search=False, system_admin=False
    )
    schemas = tool_registry.openai_schemas(perms)
    # Sadece permission='none' olanlar gelmeli
    none_tools = {t.name for t in tool_registry.all() if t.permission == "none"}
    schema_names = {s["function"]["name"] for s in schemas}
    assert schema_names == none_tools


def test_openai_schema_format() -> None:
    perms = AgentPermissions()
    schemas = tool_registry.openai_schemas(perms)
    assert len(schemas) > 0
    sample = schemas[0]
    assert sample["type"] == "function"
    assert "function" in sample
    assert "name" in sample["function"]
    assert "parameters" in sample["function"]


def test_anthropic_schema_format() -> None:
    perms = AgentPermissions()
    schemas = tool_registry.anthropic_schemas(perms)
    assert len(schemas) > 0
    sample = schemas[0]
    assert "name" in sample
    assert "input_schema" in sample


@pytest.mark.asyncio
async def test_unknown_tool_returns_error() -> None:
    perms = AgentPermissions()
    ctx = ToolContext(agent_id="test-agent", agent_name="Tester")
    result = await tool_registry.execute("nonexistent_tool", {}, perms, ctx)
    assert result.ok is False
    assert "Bilinmeyen tool" in (result.error or "")


@pytest.mark.asyncio
async def test_permission_denied_returns_error() -> None:
    perms = AgentPermissions(file_system=False)  # file system kapali
    ctx = ToolContext(agent_id="test-agent", agent_name="Tester")
    result = await tool_registry.execute(
        "read_file", {"path": "nonexistent"}, perms, ctx
    )
    assert result.ok is False
    assert "izin yok" in (result.error or "").lower()