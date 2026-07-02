"""Unit tests for new developer tools."""
from __future__ import annotations

import pytest

from app.services.tools.registry import ToolRegistry
from app.services.tools.web_reader_tool import ReadWebpageMarkdownTool
from app.services.tools.dependency_tool import InstallProjectDependencyTool
from app.services.tools.base import ToolContext


@pytest.mark.asyncio
async def test_new_tools_registration():
    """Yeni araclarin registry'de kayitli oldugunu doğrular."""
    registry = ToolRegistry()
    
    # read_webpage_markdown kontrolü
    tool = registry.get("read_webpage_markdown")
    assert tool is not None
    assert isinstance(tool, ReadWebpageMarkdownTool)
    
    # install_project_dependency kontrolü
    tool_dep = registry.get("install_project_dependency")
    assert tool_dep is not None
    assert isinstance(tool_dep, InstallProjectDependencyTool)


@pytest.mark.asyncio
async def test_web_page_reader_empty_url():
    tool = ReadWebpageMarkdownTool()
    ctx = ToolContext("agent-id", "agent-name", workspace_dir=".")
    result = await tool.execute({"url": ""}, ctx)
    assert result.ok is False
    assert "URL bos" in result.error


@pytest.mark.asyncio
async def test_dependency_installer_empty_name():
    tool = InstallProjectDependencyTool()
    ctx = ToolContext("agent-id", "agent-name", workspace_dir=".")
    result = await tool.execute({"manager": "pip", "package_name": ""}, ctx)
    assert result.ok is False
    assert "Paket adi bos" in result.error


@pytest.mark.asyncio
async def test_dependency_installer_invalid_chars():
    tool = InstallProjectDependencyTool()
    ctx = ToolContext("agent-id", "agent-name", workspace_dir=".")
    result = await tool.execute({"manager": "pip", "package_name": "numpy; rm -rf /"}, ctx)
    assert result.ok is False
    assert "Gecersiz" in result.error
