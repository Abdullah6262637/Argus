"""Sprint B.1: Workflow YAML pipeline testleri."""
from __future__ import annotations

from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

from app.services.workflow import (
    WorkflowExecutor,
    WorkflowResult,
    WorkflowStepResult,
    _render_template,
)


@pytest.fixture
def temp_workflows_dir(tmp_path: Path) -> Path:
    wd = tmp_path / "workflows"
    wd.mkdir(parents=True, exist_ok=True)
    return wd


@pytest.fixture
def executor(temp_workflows_dir: Path) -> WorkflowExecutor:
    return WorkflowExecutor(workflows_dir=str(temp_workflows_dir))


def write_workflow(dir: Path, name: str, content: str) -> Path:
    p = dir / f"{name}.yaml"
    p.write_text(content, encoding="utf-8")
    return p


class TestTemplateRendering:
    def test_render_simple_input(self):
        result = _render_template("Hello {{ inputs.name }}", {"name": "World"}, {})
        assert result == "Hello World"

    def test_render_step_result(self):
        steps = {"s1": WorkflowStepResult(id="s1", agent_id="a", prompt="", result="OUT1")}
        result = _render_template("Use: {{ steps.s1.result }}", {}, steps)
        assert result == "Use: OUT1"

    def test_render_missing_input_returns_empty(self):
        result = _render_template("Hello {{ inputs.missing }}", {}, {})
        assert result == "Hello "

    def test_render_missing_step_returns_empty(self):
        result = _render_template("Use: {{ steps.unknown.result }}", {}, {})
        assert result == "Use: "

    def test_render_multiple_substitutions(self):
        steps = {"s1": WorkflowStepResult(id="s1", agent_id="a", prompt="", result="X")}
        result = _render_template(
            "{{ inputs.a }} - {{ inputs.b }} - {{ steps.s1.result }}",
            {"a": "1", "b": "2"},
            steps,
        )
        assert result == "1 - 2 - X"

    def test_render_no_placeholders(self):
        assert _render_template("plain text", {"a": 1}, {}) == "plain text"

    def test_render_step_error(self):
        steps = {
            "s1": WorkflowStepResult(id="s1", agent_id="a", prompt="", error="oops")
        }
        result = _render_template("{{ steps.s1.error }}", {}, steps)
        assert result == "oops"


class TestWorkflowList:
    def test_list_empty(self, executor: WorkflowExecutor):
        assert executor.list_workflows() == []

    def test_list_yaml_files(self, temp_workflows_dir: Path, executor: WorkflowExecutor):
        write_workflow(temp_workflows_dir, "wf1", "name: a\nsteps: []\n")
        write_workflow(temp_workflows_dir, "wf2", "name: b\nsteps: []\n")
        # Yaml olmayan bir dosya
        (temp_workflows_dir / "ignored.txt").write_text("xxx")

        items = executor.list_workflows()
        assert sorted(items) == ["wf1", "wf2"]


class TestWorkflowLoad:
    def test_load_existing(self, temp_workflows_dir: Path, executor: WorkflowExecutor):
        write_workflow(
            temp_workflows_dir,
            "test",
            "name: test\nsteps:\n  - id: s1\n    agent: a\n    prompt: hi\n",
        )
        data = executor.load_workflow("test")
        assert data["name"] == "test"
        assert len(data["steps"]) == 1

    def test_load_missing_raises(self, executor: WorkflowExecutor):
        with pytest.raises(FileNotFoundError):
            executor.load_workflow("nonexistent")


@pytest.mark.asyncio
class TestWorkflowExecution:
    async def test_run_missing_workflow_raises(self, executor: WorkflowExecutor):
        with pytest.raises(FileNotFoundError):
            await executor.run("ghost")

    async def test_run_missing_agent_in_step(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        write_workflow(
            temp_workflows_dir,
            "noagent",
            "name: noagent\nsteps:\n  - id: s1\n    prompt: hi\n",
        )
        result = await executor.run("noagent")
        assert result.success is False
        assert result.error is not None
        assert "agent" in result.error.lower()

    async def test_run_unknown_agent(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        write_workflow(
            temp_workflows_dir,
            "ghost",
            "name: ghost\nsteps:\n  - id: s1\n    agent: nonexistent_agent_xyz\n    prompt: hi\n",
        )
        result = await executor.run("ghost")
        assert result.success is False
        assert "bulunamadi" in (result.error or "").lower() or "not found" in (result.error or "").lower()

    async def test_run_with_mocked_loop(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        """run_agent_loop'u mockla — gerek olmadan calisma akisi test edilir."""
        write_workflow(
            temp_workflows_dir,
            "two_steps",
            (
                "name: two_steps\n"
                "inputs:\n"
                "  - topic\n"
                "steps:\n"
                "  - id: search\n"
                "    agent: mocked\n"
                "    prompt: 'Search for {{ inputs.topic }}'\n"
                "  - id: write\n"
                "    agent: mocked\n"
                "    prompt: 'Use: {{ steps.search.result }}'\n"
            ),
        )

        # require() tarafindan kullanilan get'i mockla
        from app.services.agent_manager import AgentDefinition, agent_manager

        fake_agent = AgentDefinition(
            id="mocked",
            name="Mocked",
            role="",
            provider="openai",
            model="gpt-4o-mini",
        )

        class FakeLoopResult:
            def __init__(self, content: str):
                self.final_content = content
                self.tool_calls = []

        with patch.object(agent_manager, "require", return_value=fake_agent), \
             patch(
                 "app.services.workflow.run_agent_loop",
                 new_callable=AsyncMock,
                 side_effect=[FakeLoopResult("FOUND"), FakeLoopResult("WRITTEN")],
             ):
            result = await executor.run("two_steps", inputs={"topic": "AI"})

        assert result.success is True
        assert len(result.steps) == 2
        assert result.steps[0].result == "FOUND"
        assert result.steps[1].result == "WRITTEN"
        # Template substitution dogru gerceklesmeli
        assert "AI" in result.steps[0].prompt
        assert "FOUND" in result.steps[1].prompt
        assert result.final_output == "WRITTEN"

    async def test_run_step_failure_stops_chain(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        write_workflow(
            temp_workflows_dir,
            "fail_chain",
            (
                "name: fail_chain\n"
                "steps:\n"
                "  - id: a\n"
                "    agent: mocked\n"
                "    prompt: hi\n"
                "  - id: b\n"
                "    agent: mocked\n"
                "    prompt: hi\n"
            ),
        )

        from app.services.agent_manager import AgentDefinition, agent_manager
        fake_agent = AgentDefinition(
            id="mocked",
            name="Mocked",
            role="",
            provider="openai",
            model="gpt-4o-mini",
        )

        with patch.object(agent_manager, "require", return_value=fake_agent), \
             patch(
                 "app.services.workflow.run_agent_loop",
                 new_callable=AsyncMock,
                 side_effect=RuntimeError("loop crashed"),
             ):
            result = await executor.run("fail_chain")

        assert result.success is False
        assert result.error is not None
        # Yalnizca ilk step calistirilmis olmali
        assert len(result.steps) == 1
        assert result.steps[0].success is False

    async def test_run_with_condition_skipping(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        write_workflow(
            temp_workflows_dir,
            "conditional_wf",
            (
                "name: conditional_wf\n"
                "inputs:\n"
                "  - run_second\n"
                "steps:\n"
                "  - id: first\n"
                "    agent: mocked\n"
                "    prompt: 'First step'\n"
                "  - id: second\n"
                "    agent: mocked\n"
                "    condition: '{{ inputs.run_second }}'\n"
                "    prompt: 'Second step'\n"
            ),
        )

        from app.services.agent_manager import AgentDefinition, agent_manager
        fake_agent = AgentDefinition(
            id="mocked",
            name="Mocked",
            role="",
            provider="openai",
            model="gpt-4o-mini",
        )

        class FakeLoopResult:
            def __init__(self, content: str):
                self.final_content = content
                self.tool_calls = []

        # Run with run_second="false" -> should skip second step
        with patch.object(agent_manager, "require", return_value=fake_agent), \
             patch(
                 "app.services.workflow.run_agent_loop",
                 new_callable=AsyncMock,
                 return_value=FakeLoopResult("DONE_FIRST"),
             ):
            result = await executor.run("conditional_wf", inputs={"run_second": "false"})

        assert result.success is True
        assert len(result.steps) == 2
        assert result.steps[0].success is True
        assert result.steps[0].result == "DONE_FIRST"
        assert result.steps[1].success is True
        assert result.steps[1].skipped is True
        assert result.steps[1].result == "Skipped"
        assert result.final_output == "DONE_FIRST"

    async def test_run_with_retries(
        self,
        temp_workflows_dir: Path,
        executor: WorkflowExecutor,
    ):
        write_workflow(
            temp_workflows_dir,
            "retry_wf",
            (
                "name: retry_wf\n"
                "steps:\n"
                "  - id: s1\n"
                "    agent: mocked\n"
                "    retry_limit: 2\n"
                "    prompt: 'Retry step'\n"
            ),
        )

        from app.services.agent_manager import AgentDefinition, agent_manager
        fake_agent = AgentDefinition(
            id="mocked",
            name="Mocked",
            role="",
            provider="openai",
            model="gpt-4o-mini",
        )

        class FakeLoopResult:
            def __init__(self, content: str):
                self.final_content = content
                self.tool_calls = []

        # First two calls fail, third call succeeds
        with patch.object(agent_manager, "require", return_value=fake_agent), \
             patch(
                 "app.services.workflow.run_agent_loop",
                 new_callable=AsyncMock,
                 side_effect=[RuntimeError("fail 1"), RuntimeError("fail 2"), FakeLoopResult("SUCCESS")],
             ):
            result = await executor.run("retry_wf")

        assert result.success is True
        assert len(result.steps) == 1
        assert result.steps[0].success is True
        assert result.steps[0].result == "SUCCESS"
        assert result.steps[0].error is None