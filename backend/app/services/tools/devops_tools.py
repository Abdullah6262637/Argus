"""Sprint D.6: DevOps tool'lari (Docker, kubectl).

Tum tool'lar terminal_cmd permission'i gerektirir; bazilari (docker_run, kubectl_apply,
docker_build) HIGH_RISK olarak isaretlenir → HITL onay.

Implementasyon: subprocess uzerinden CLI'a komut yollar; docker.py / kubernetes
SDK'larina bagimliligi yok.
"""
from __future__ import annotations

import asyncio
import logging
import shlex
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


async def _run_cmd(cmd: List[str], timeout: float = 60.0) -> tuple[int, str, str]:
    """CLI komutunu calistir, (returncode, stdout, stderr) doner."""
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        try:
            proc.kill()
        except Exception:
            pass
        return -1, "", f"Komut zaman asimi: {timeout}s"
    return (
        proc.returncode or 0,
        stdout.decode("utf-8", errors="replace"),
        stderr.decode("utf-8", errors="replace"),
    )


# ============================================================
# Docker
# ============================================================


class DockerPsTool(BaseTool):
    name = "docker_ps"
    description = "Calisan Docker container'larini listeler (docker ps -a)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "all": {"type": "boolean", "default": True, "description": "True ise -a (tum container'lar)"}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        cmd = ["docker", "ps", "--format", "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}"]
        if args.get("all", True):
            cmd.append("-a")
        rc, out, err = await _run_cmd(cmd, timeout=15)
        if rc != 0:
            return ToolResult(ok=False, error=f"docker ps hata (rc={rc}): {err.strip() or out.strip()}")
        return ToolResult(ok=True, output=out.strip(), data={"raw": out})


class DockerLogsTool(BaseTool):
    name = "docker_logs"
    description = "Bir Docker container'in son loglarini doner (docker logs --tail N <id>)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "container": {"type": "string", "description": "Container ID veya isim"},
            "tail": {"type": "integer", "default": 100, "description": "Son N satir"}},
        "required": ["container"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        container = (args.get("container") or "").strip()
        if not container:
            return ToolResult(ok=False, error="container bos olamaz")
        tail = int(args.get("tail") or 100)

        cmd = ["docker", "logs", "--tail", str(tail), container]
        rc, out, err = await _run_cmd(cmd, timeout=20)
        text = out + ("\n[STDERR]\n" + err if err else "")
        return ToolResult(
            ok=(rc == 0),
            output=text.strip()[-4000:],
            error=None if rc == 0 else err.strip() or "log alinamadi",
            data={"container": container, "tail": tail, "exit_code": rc},
        )


class DockerRunTool(BaseTool):
    """[HIGH RISK] HITL onayi gerektirir."""
    name = "docker_run"
    description = (
        "[YUKSEK RISK] docker run komutu calistirir. Container baslatir; "
        "yeni process spawn ettigi icin HITL onayi gerektirir."
    )
    permission = "terminal_cmd"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "image": {"type": "string", "description": "Docker image (ornek: nginx:alpine)"},
            "args": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Ek docker run argumanlari (-d, -p 80:80, --name foo, ...)"},
            "command": {
                "type": "array",
                "items": {"type": "string"},
                "description": "(opsiyonel) Container icinde calistirilacak komut"}},
        "required": ["image"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        image = (args.get("image") or "").strip()
        if not image:
            return ToolResult(ok=False, error="image bos olamaz")
        extra = args.get("args") or []
        command = args.get("command") or []

        cmd = ["docker", "run"] + [str(a) for a in extra] + [image] + [str(c) for c in command]
        rc, out, err = await _run_cmd(cmd, timeout=120)
        return ToolResult(
            ok=(rc == 0),
            output=(out + ("\n[STDERR]\n" + err if err else "")).strip(),
            error=None if rc == 0 else err.strip() or "docker run basarisiz",
            data={"image": image, "exit_code": rc, "command": cmd},
        )


class DockerBuildTool(BaseTool):
    """[HIGH RISK] HITL onayi gerektirir."""
    name = "docker_build"
    description = "[YUKSEK RISK] docker build komutuyla bir image olusturur."
    permission = "terminal_cmd"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "context_path": {"type": "string", "description": "Build context (genelde '.')"},
            "tag": {"type": "string", "description": "Tag (ornek: myapp:latest)"},
            "dockerfile": {"type": "string", "description": "(opsiyonel) Ozel Dockerfile yolu"}},
        "required": ["context_path", "tag"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        ctx = (args.get("context_path") or "").strip()
        tag = (args.get("tag") or "").strip()
        dockerfile = (args.get("dockerfile") or "").strip()
        if not ctx or not tag:
            return ToolResult(ok=False, error="context_path ve tag zorunlu")

        cmd = ["docker", "build", "-t", tag]
        if dockerfile:
            cmd += ["-f", dockerfile]
        cmd.append(ctx)
        rc, out, err = await _run_cmd(cmd, timeout=600)  # 10 dakika
        return ToolResult(
            ok=(rc == 0),
            output=(out + ("\n[STDERR]\n" + err if err else "")).strip()[-4000:],
            error=None if rc == 0 else err.strip() or "docker build basarisiz",
            data={"tag": tag, "context": ctx, "exit_code": rc},
        )


# ============================================================
# kubectl
# ============================================================


class KubectlGetTool(BaseTool):
    name = "kubectl_get"
    description = "Kubernetes kaynaklarini listeler (kubectl get <resource>)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "resource": {
                "type": "string",
                "description": "Kaynak tipi: pods, deployments, services, nodes, ..."},
            "namespace": {"type": "string", "default": "default"},
            "all_namespaces": {"type": "boolean", "default": False}},
        "required": ["resource"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        resource = (args.get("resource") or "").strip()
        if not resource:
            return ToolResult(ok=False, error="resource bos olamaz")
        ns = (args.get("namespace") or "default").strip()
        all_ns = bool(args.get("all_namespaces"))

        cmd = ["kubectl", "get", resource]
        if all_ns:
            cmd.append("-A")
        else:
            cmd += ["-n", ns]
        rc, out, err = await _run_cmd(cmd, timeout=30)
        return ToolResult(
            ok=(rc == 0),
            output=(out + ("\n[STDERR]\n" + err if err else "")).strip(),
            error=None if rc == 0 else err.strip(),
            data={"resource": resource, "namespace": ns, "exit_code": rc},
        )


class KubectlLogsTool(BaseTool):
    name = "kubectl_logs"
    description = "Bir pod'un loglarini doner (kubectl logs --tail N <pod>)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "pod": {"type": "string"},
            "namespace": {"type": "string", "default": "default"},
            "tail": {"type": "integer", "default": 100},
            "container": {"type": "string", "description": "(opsiyonel) Pod icinde container ismi"}},
        "required": ["pod"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        pod = (args.get("pod") or "").strip()
        if not pod:
            return ToolResult(ok=False, error="pod bos olamaz")
        ns = (args.get("namespace") or "default").strip()
        tail = int(args.get("tail") or 100)
        container = (args.get("container") or "").strip()

        cmd = ["kubectl", "logs", "--tail", str(tail), pod, "-n", ns]
        if container:
            cmd += ["-c", container]
        rc, out, err = await _run_cmd(cmd, timeout=30)
        return ToolResult(
            ok=(rc == 0),
            output=(out + ("\n[STDERR]\n" + err if err else "")).strip()[-4000:],
            error=None if rc == 0 else err.strip(),
            data={"pod": pod, "namespace": ns, "exit_code": rc},
        )


class KubectlApplyTool(BaseTool):
    """[HIGH RISK] HITL onayi gerektirir."""
    name = "kubectl_apply"
    description = "[YUKSEK RISK] Kubernetes manifest dosyasini uygular (kubectl apply -f)."
    permission = "terminal_cmd"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "manifest_path": {"type": "string", "description": "YAML/JSON manifest dosyasi yolu"},
            "namespace": {"type": "string", "default": "default"}},
        "required": ["manifest_path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = (args.get("manifest_path") or "").strip()
        if not path:
            return ToolResult(ok=False, error="manifest_path bos olamaz")
        ns = (args.get("namespace") or "default").strip()

        cmd = ["kubectl", "apply", "-f", path, "-n", ns]
        rc, out, err = await _run_cmd(cmd, timeout=60)
        return ToolResult(
            ok=(rc == 0),
            output=(out + ("\n[STDERR]\n" + err if err else "")).strip(),
            error=None if rc == 0 else err.strip(),
            data={"manifest": path, "namespace": ns, "exit_code": rc},
        )