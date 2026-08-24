import pytest
from typing import Dict, Any

from app.services.tools.agent_tools import (
    StartDebateTool,
    RequestBrainstormTool,
    ProposeCompromiseTool,
)
from app.services.tools.base import ToolContext
from app.services.agent_manager import AgentDefinition
from app.schemas.agent import AgentPermissions


@pytest.fixture
def mock_agent_manager(monkeypatch):
    class MockManager:
        def require(self, agent_id: str):
            if agent_id == "mimar":
                return AgentDefinition(
                    id="mimar",
                    name="Mimar",
                    role="Architect",
                    provider="fake",
                    model="fake",
                    system_prompt="Test mimar",
                    is_active=True
                )
            elif agent_id == "fikir-uzmani":
                return AgentDefinition(
                    id="fikir-uzmani",
                    name="Fikir Uzmani",
                    role="Brainstormer",
                    provider="fake",
                    model="fake",
                    system_prompt="Test fikir uzmani",
                    is_active=True
                )
            raise KeyError(f"Not found: {agent_id}")
            
    monkeypatch.setattr("app.services.agent_manager.agent_manager", MockManager())


@pytest.mark.asyncio
async def test_start_debate_tool(mock_agent_manager, monkeypatch):
    async def mock_execute(*args, **kwargs):
        class MockResult:
            final_content = "Tartisma sonucu: Kabul ediyorum."
            tool_calls = []
            steps = 1
            total_tokens = 100
        return MockResult()

    monkeypatch.setattr("app.services.agent_loop.run_agent_loop", mock_execute)

    tool = StartDebateTool()
    ctx = ToolContext(agent_id="test_agent", agent_name="Test", workspace_dir="/tmp", extra={})
    
    result = await tool.execute({
        "target_agent_id": "mimar",
        "topic": "Veritabani olarak PostgreSQL mi MongoDB mi?"
    }, ctx)
    
    assert result.ok is True
    assert "Kabul ediyorum." in result.output


@pytest.mark.asyncio
async def test_request_brainstorm_tool(mock_agent_manager, monkeypatch):
    async def mock_execute(*args, **kwargs):
        class MockResult:
            final_content = "Fikir 1: X\nFikir 2: Y\nFikir 3: Z"
            tool_calls = []
            steps = 1
            total_tokens = 100
        return MockResult()

    monkeypatch.setattr("app.services.agent_loop.run_agent_loop", mock_execute)

    tool = RequestBrainstormTool()
    ctx = ToolContext(agent_id="mimar", agent_name="Mimar", workspace_dir="/tmp", extra={})
    
    result = await tool.execute({
        "problem_statement": "Nasil daha hizli cache yapariz?"
    }, ctx)
    
    assert result.ok is True
    assert "Fikir 1: X" in result.output


@pytest.mark.asyncio
async def test_propose_compromise_tool():
    tool = ProposeCompromiseTool()
    ctx = ToolContext(agent_id="mimar", agent_name="Mimar", workspace_dir="/tmp", extra={})
    
    result = await tool.execute({
        "topic_key": "cache_strategy",
        "agreed_solution": "Redis kullanilacak"
    }, ctx)
    
    assert result.ok is True
    assert "uzlasma_cache_strategy" in result.output
    
    # Check if blackboard is updated
    assert ctx.extra["blackboard"]["uzlasma_cache_strategy"] == "Redis kullanilacak"
