"""WorkflowExecutor: YAML tabanli cok-ajanli workflow runner (FAZ 4.3).

YAML format ornegi:

```yaml
name: research_and_write
description: Konu hakkinda arastir ve yaz
inputs:
  - topic
steps:
  - id: search
    agent: researcher
    prompt: "{{ inputs.topic }} hakkinda 5 kaynak topla"
  - id: outline
    agent: writer
    prompt: "Bu kaynaklara dayanarak outline cikar:\n{{ steps.search.result }}"
  - id: draft
    agent: writer
    prompt: "Outline'a gore 1000 kelimelik makale yaz:\n{{ steps.outline.result }}"
```
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

from app.services.agent_loop import run_agent_loop
from app.services.agent_manager import agent_manager

logger = logging.getLogger(__name__)


@dataclass
class WorkflowStepResult:
    id: str
    agent_id: str
    prompt: str
    result: str = ""
    tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    success: bool = False
    skipped: bool = False


@dataclass
class WorkflowResult:
    name: str
    success: bool
    steps: List[WorkflowStepResult] = field(default_factory=list)
    final_output: str = ""
    error: Optional[str] = None


_TPL_RE = re.compile(r"\{\{\s*([^}]+)\s*\}\}")


def _render_template(template: str, inputs: Dict[str, Any], steps: Dict[str, WorkflowStepResult]) -> str:
    """Cok basit Jinja-benzeri sablon: {{ inputs.X }} ve {{ steps.id.result }}."""
    def replace(match: re.Match) -> str:
        expr = match.group(1).strip()
        parts = expr.split(".")
        if len(parts) >= 2 and parts[0] == "inputs":
            value = inputs
            for k in parts[1:]:
                if isinstance(value, dict) and k in value:
                    value = value[k]
                else:
                    return ""
            return str(value)
        if len(parts) >= 3 and parts[0] == "steps":
            step_id = parts[1]
            field_name = parts[2]
            step = steps.get(step_id)
            if not step:
                return ""
            if field_name == "result":
                return step.result
            if field_name == "error":
                return step.error or ""
            return ""
        return match.group(0)

    return _TPL_RE.sub(replace, template)


class WorkflowExecutor:
    def __init__(self, workflows_dir: Optional[str] = None) -> None:
        from app.config import get_settings
        settings = get_settings()
        self.workflows_dir = Path(
            workflows_dir or (settings.backend_dir / "agents" / "workflows")
        )

    def list_workflows(self) -> List[str]:
        if not self.workflows_dir.exists():
            return []
        return [p.stem for p in self.workflows_dir.glob("*.yaml")]

    def load_workflow(self, name: str) -> Dict[str, Any]:
        path = self.workflows_dir / f"{name}.yaml"
        if not path.exists():
            raise FileNotFoundError(f"Workflow bulunamadi: {name}")
        with path.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return data

    async def run(
        self,
        name: str,
        inputs: Optional[Dict[str, Any]] = None,
    ) -> WorkflowResult:
        import asyncio
        workflow = self.load_workflow(name)
        inputs = inputs or {}

        result = WorkflowResult(name=name, success=False)
        steps_map: Dict[str, WorkflowStepResult] = {}

        for raw_step in workflow.get("steps", []):
            step_id = str(raw_step.get("id") or f"s{len(steps_map) + 1}")
            agent_id = str(raw_step.get("agent_id") or raw_step.get("agent") or "").strip()
            prompt_template = str(raw_step.get("prompt") or "")
            max_steps = int(raw_step.get("max_steps", 6))
            retry_limit = int(raw_step.get("retry_limit") or raw_step.get("retries") or 0)
            condition = raw_step.get("condition")

            # Check condition first if specified
            if condition is not None:
                rendered_condition = _render_template(str(condition), inputs, steps_map).strip().lower()
                # Skip if empty, false, 0, or none
                if rendered_condition in ("", "false", "0", "none"):
                    logger.info("Workflow step %s skipped due to condition: %s", step_id, rendered_condition)
                    step_result = WorkflowStepResult(
                        id=step_id, agent_id=agent_id, prompt="",
                        result="Skipped", success=True, skipped=True
                    )
                    steps_map[step_id] = step_result
                    result.steps.append(step_result)
                    continue

            if not agent_id:
                step_result = WorkflowStepResult(
                    id=step_id, agent_id="", prompt="",
                    error="Step icin 'agent' veya 'agent_id' belirtilmedi",
                )
                steps_map[step_id] = step_result
                result.steps.append(step_result)
                result.error = step_result.error
                return result

            try:
                agent = agent_manager.require(agent_id)
            except KeyError:
                step_result = WorkflowStepResult(
                    id=step_id, agent_id=agent_id, prompt="",
                    error=f"Ajan bulunamadi: {agent_id}",
                )
                steps_map[step_id] = step_result
                result.steps.append(step_result)
                result.error = step_result.error
                return result

            rendered_prompt = _render_template(prompt_template, inputs, steps_map)
            step_result = WorkflowStepResult(
                id=step_id, agent_id=agent_id, prompt=rendered_prompt,
            )

            attempts = 0
            while attempts <= retry_limit:
                try:
                    loop_result = await run_agent_loop(
                        agent, history=[], user_message=rendered_prompt, max_steps=max_steps,
                    )
                    step_result.result = loop_result.final_content
                    step_result.tool_calls = [tc.to_dict() for tc in loop_result.tool_calls]
                    step_result.success = True
                    step_result.error = None
                    break
                except Exception as exc:
                    attempts += 1
                    logger.warning("Workflow step %s error (attempt %d/%d): %s", step_id, attempts, retry_limit + 1, exc)
                    step_result.error = str(exc)
                    if attempts <= retry_limit:
                        await asyncio.sleep(1)
                    else:
                        logger.exception("Workflow step %s failed after all retries", step_id)

            steps_map[step_id] = step_result
            result.steps.append(step_result)

            if not step_result.success:
                result.error = f"Step {step_id} basarisiz: {step_result.error}"
                return result

        result.success = True
        # Son step'in result'i = final output (atlayarak gecilmemis son adim)
        active_steps = [s for s in result.steps if not s.skipped]
        if active_steps:
            result.final_output = active_steps[-1].result
        elif result.steps:
            result.final_output = result.steps[-1].result
        return result


# Singleton
workflow_executor = WorkflowExecutor()