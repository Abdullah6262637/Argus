"""Unit tests for advanced developer tools."""
from __future__ import annotations

import pytest

from app.services.tools.registry import ToolRegistry
from app.services.tools.github_api_tool import GitHubAPITool
from app.services.tools.docker_sandbox_tool import DockerSandboxRunTool
from app.services.tools.doc_layout_tool import ParseLayoutDocumentTool
from app.services.tools.base import ToolContext


@pytest.mark.asyncio
async def test_advanced_tools_registration():
    """Gelismiş araclarin registry'de kayitli oldugunu doğrular."""
    registry = ToolRegistry()
    
    # github_api kontrolü
    tool = registry.get("github_api")
    assert tool is not None
    assert isinstance(tool, GitHubAPITool)
    
    # docker_sandbox_run kontrolü
    tool_docker = registry.get("docker_sandbox_run")
    assert tool_docker is not None
    assert isinstance(tool_docker, DockerSandboxRunTool)
    
    # parse_layout_document kontrolü
    tool_layout = registry.get("parse_layout_document")
    assert tool_layout is not None
    assert isinstance(tool_layout, ParseLayoutDocumentTool)


@pytest.mark.asyncio
async def test_github_api_no_token():
    tool = GitHubAPITool()
    ctx = ToolContext("agent-id", "agent-name", workspace_dir=".")
    result = await tool.execute({"action": "create_issue", "repo": "octocat/Hello-World", "title": "test"}, ctx)
    assert result.ok is False
    assert "GITHUB_TOKEN" in result.error


@pytest.mark.asyncio
async def test_parse_layout_document_not_found():
    tool = ParseLayoutDocumentTool()
    ctx = ToolContext("agent-id", "agent-name", workspace_dir=".")
    result = await tool.execute({"file_path": "non_existent_file.pdf"}, ctx)
    assert result.ok is False
    assert "bulunamadi" in result.error
