"""/api/workflows router - YAML workflow yurutucu + CRUD."""
from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.workflow import workflow_executor

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


_NAME_RE = re.compile(r"^[a-zA-Z0-9_\-]+$")


def _validate_name(name: str) -> str:
    n = (name or "").strip()
    if not n or not _NAME_RE.match(n):
        raise HTTPException(400, "Workflow adi yalnizca a-z, A-Z, 0-9, '_' ve '-' icerebilir.")
    return n


def _wf_path(name: str) -> Path:
    return workflow_executor.workflows_dir / f"{name}.yaml"


class WorkflowRunRequest(BaseModel):
    inputs: Dict[str, Any] = Field(default_factory=dict)


class WorkflowSaveRequest(BaseModel):
    content: str = Field(..., description="YAML icerigi (raw string)")
    overwrite: bool = False


class WorkflowSaveResponse(BaseModel):
    name: str
    path: str
    bytes: int


class WorkflowStepOut(BaseModel):
    id: str
    agent_id: str
    success: bool
    result: str = ""
    error: Optional[str] = None
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list)
    skipped: bool = False


class WorkflowRunOut(BaseModel):
    name: str
    success: bool
    final_output: str = ""
    error: Optional[str] = None
    steps: List[WorkflowStepOut] = Field(default_factory=list)


@router.get("", response_model=List[str])
async def list_workflows() -> List[str]:
    return workflow_executor.list_workflows()


@router.get("/{name}")
async def get_workflow(name: str) -> Dict[str, Any]:
    name = _validate_name(name)
    try:
        return workflow_executor.load_workflow(name)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc))


@router.get("/{name}/raw")
async def get_workflow_raw(name: str) -> Dict[str, str]:
    """YAML kaynak metnini doner (editor icin)."""
    name = _validate_name(name)
    p = _wf_path(name)
    if not p.exists():
        raise HTTPException(404, f"Workflow bulunamadi: {name}")
    return {"name": name, "content": p.read_text(encoding="utf-8")}


@router.put("/{name}", response_model=WorkflowSaveResponse)
async def save_workflow(name: str, payload: WorkflowSaveRequest) -> WorkflowSaveResponse:
    """Workflow YAML dosyasini olustur/guncelle."""
    name = _validate_name(name)
    # YAML dogrula
    try:
        parsed = yaml.safe_load(payload.content)
    except yaml.YAMLError as exc:
        raise HTTPException(400, f"YAML parse hatasi: {exc}")
    if not isinstance(parsed, dict):
        raise HTTPException(400, "YAML kok seviyede bir nesne olmali.")
    if not isinstance(parsed.get("steps"), list) or not parsed["steps"]:
        raise HTTPException(400, "Workflow en az bir 'steps' listesi icermeli.")
    for i, st in enumerate(parsed["steps"], start=1):
        if not isinstance(st, dict) or ("agent" not in st and "agent_id" not in st):
            raise HTTPException(400, f"Step #{i} icin 'agent' veya 'agent_id' alani gerekli.")

    p = _wf_path(name)
    p.parent.mkdir(parents=True, exist_ok=True)
    if p.exists() and not payload.overwrite:
        raise HTTPException(409, f"Zaten var: {name}.yaml (overwrite=true ile uzerine yazabilirsin)")
    p.write_text(payload.content, encoding="utf-8")
    return WorkflowSaveResponse(name=name, path=str(p), bytes=len(payload.content.encode("utf-8")))


@router.delete("/{name}", status_code=204)
async def delete_workflow(name: str) -> None:
    name = _validate_name(name)
    p = _wf_path(name)
    if not p.exists():
        raise HTTPException(404, f"Workflow bulunamadi: {name}")
    p.unlink()


@router.post("/{name}/run", response_model=WorkflowRunOut)
async def run_workflow(name: str, payload: WorkflowRunRequest) -> WorkflowRunOut:
    name = _validate_name(name)
    try:
        result = await workflow_executor.run(name, inputs=payload.inputs)
    except FileNotFoundError as exc:
        raise HTTPException(404, str(exc))
    return WorkflowRunOut(
        name=result.name,
        success=result.success,
        final_output=result.final_output,
        error=result.error,
        steps=[
            WorkflowStepOut(
                id=s.id, agent_id=s.agent_id, success=s.success,
                result=s.result, error=s.error, tool_calls=s.tool_calls,
                skipped=s.skipped,
            )
            for s in result.steps
        ],
    )