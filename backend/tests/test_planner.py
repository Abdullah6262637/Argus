"""Sprint B.1: TaskPlanner JSON çıktı validation testleri."""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest

from app.services.agent_manager import AgentDefinition
from app.services.planning.models import PlanStatus
from app.services.planning.planner import TaskPlanner


def _fake_agent() -> AgentDefinition:
    return AgentDefinition(
        id="test",
        name="Test",
        role="Tester",
        provider="openai",
        model="gpt-4o-mini",
    )


class _FakeResponse:
    def __init__(self, content: str):
        self.content = content
        self.tool_calls = None
        self.usage = None


class TestPlannerJsonParse:
    def test_parse_clean_json(self):
        planner = TaskPlanner()
        text = '{"reasoning": "test", "steps": [{"title": "A"}]}'
        data = planner._parse_plan_json(text)
        assert data["reasoning"] == "test"
        assert len(data["steps"]) == 1

    def test_parse_markdown_codeblock(self):
        planner = TaskPlanner()
        text = '```json\n{"reasoning": "x", "steps": []}\n```'
        data = planner._parse_plan_json(text)
        assert data["reasoning"] == "x"

    def test_parse_with_surrounding_text(self):
        planner = TaskPlanner()
        text = 'Here is plan:\n{"reasoning": "y", "steps": []}\nThanks!'
        data = planner._parse_plan_json(text)
        assert data["reasoning"] == "y"

    def test_parse_invalid_returns_empty(self):
        planner = TaskPlanner()
        data = planner._parse_plan_json("not json at all")
        assert data == {}

    def test_parse_empty_string(self):
        planner = TaskPlanner()
        assert planner._parse_plan_json("") == {}


class TestPlannerBuildSteps:
    def test_build_steps_basic(self):
        planner = TaskPlanner(max_steps=5)
        raw = [
            {"title": "Step1", "description": "do A", "expected_output": "A"},
            {"title": "Step2", "description": "do B", "tool_hints": ["read_file"]}]
        steps = planner._build_steps(raw, available_tools=["read_file", "write_file"])
        assert len(steps) == 2
        assert steps[0].id == 1
        assert steps[0].title == "Step1"
        assert steps[1].tool_hints == ["read_file"]

    def test_build_steps_filters_unknown_hints(self):
        planner = TaskPlanner()
        raw = [
            {"title": "x", "description": "y", "tool_hints": ["read_file", "fake_tool"]}]
        steps = planner._build_steps(raw, available_tools=["read_file"])
        assert steps[0].tool_hints == ["read_file"]

    def test_build_steps_respects_max_steps(self):
        planner = TaskPlanner(max_steps=2)
        raw = [{"title": f"s{i}", "description": "x"} for i in range(5)]
        steps = planner._build_steps(raw, available_tools=[])
        assert len(steps) == 2

    def test_build_steps_skips_non_dict(self):
        planner = TaskPlanner()
        raw = ["not a dict", {"title": "ok", "description": "d"}]  # type: ignore
        steps = planner._build_steps(raw, available_tools=[])
        assert len(steps) == 1
        assert steps[0].title == "ok"

    def test_build_steps_default_title(self):
        planner = TaskPlanner()
        steps = planner._build_steps([{"description": "no title"}], [])
        assert steps[0].title.startswith("Adim")


@pytest.mark.asyncio
class TestPlannerCreate:
    async def test_create_plan_with_valid_response(self):
        planner = TaskPlanner(max_steps=5)
        agent = _fake_agent()

        response = _FakeResponse(
            '{"reasoning": "simple", "steps": ['
            '{"title": "Search", "description": "Find info", "expected_output": "list"},'
            '{"title": "Write", "description": "Write text", "expected_output": "text"}'
            ']}'
        )

        fake_provider = AsyncMock()
        fake_provider.chat = AsyncMock(return_value=response)

        with patch("app.services.planning.planner.get_provider", return_value=fake_provider):
            plan = await planner.create_plan("Yaz makale", agent)

        assert plan.goal == "Yaz makale"
        assert plan.agent_id == "test"
        assert plan.status == PlanStatus.DRAFT
        assert len(plan.steps) == 2
        assert plan.steps[0].title == "Search"

    async def test_create_plan_with_empty_response_creates_default_step(self):
        planner = TaskPlanner()
        agent = _fake_agent()

        response = _FakeResponse("not even close to JSON")
        fake_provider = AsyncMock()
        fake_provider.chat = AsyncMock(return_value=response)

        with patch("app.services.planning.planner.get_provider", return_value=fake_provider):
            plan = await planner.create_plan("My Goal", agent)

        # En az 1 default step olmali
        assert len(plan.steps) >= 1
        assert plan.steps[0].description == "My Goal"

    async def test_create_plan_caps_steps_at_max(self):
        planner = TaskPlanner(max_steps=3)
        agent = _fake_agent()

        big_steps = ",".join(
            [f'{{"title":"s{i}","description":"d{i}"}}' for i in range(10)]
        )
        response = _FakeResponse(f'{{"reasoning":"big","steps":[{big_steps}]}}')
        fake_provider = AsyncMock()
        fake_provider.chat = AsyncMock(return_value=response)

        with patch("app.services.planning.planner.get_provider", return_value=fake_provider):
            plan = await planner.create_plan("Goal", agent)

        assert len(plan.steps) == 3