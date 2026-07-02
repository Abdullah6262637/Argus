"""DockerSandboxRunTool: Izole docker sandbox calistiricisi."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class DockerSandboxRunTool(BaseTool):
    """Kod parçacıklarını izole Docker konteyneri içinde güvenle çalıştırır."""

    name = "docker_sandbox_run"
    description = (
        "Kod parçacıklarını güvenli ve izole bir Docker konteyneri içinde çalıştırır. "
        "Kullanıcının ana sistemine zarar vermeden python, Node.js veya kabuk kodlarını "
        "test etmek için bu aracı kullanın."
    )
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "image": {
                "type": "string",
                "enum": ["python:3.11-slim", "node:18-alpine", "ubuntu:latest"],
                "description": "Kullanılacak Docker imajı",
                "default": "python:3.11-slim"
            },
            "command": {
                "type": "string",
                "description": "Konteyner içinde çalıştırılacak tam komut (örneğin 'python -c \"print(5*5)\"')"
            },
            "timeout_sec": {
                "type": "integer",
                "description": "Maksimum çalışma süresi (saniye)",
                "default": 30
            }
        },
        "required": ["command"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        image = args.get("image", "python:3.11-slim")
        command = (args.get("command") or "").strip()
        timeout = float(args.get("timeout_sec") or 30)

        if not command:
            return ToolResult(ok=False, error="Komut bos olamaz")

        docker_cmd = ["docker", "run", "--rm", image, "sh", "-c", command]

        try:
            # Check docker status
            test_proc = await asyncio.create_subprocess_exec(
                "docker", "info",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                await asyncio.wait_for(test_proc.communicate(), timeout=3.0)
            except asyncio.TimeoutError:
                test_proc.kill()
                return ToolResult(ok=False, error="Docker daemon yanit vermiyor. Sandbox baslatilamadi.")
                
            if test_proc.returncode != 0:
                return ToolResult(
                    ok=False,
                    error="Docker daemon calismiyor veya yetki hatasi var. Sandbox ortamı baslatilamadi."
                )

            proc = await asyncio.create_subprocess_exec(
                docker_cmd[0], *docker_cmd[1:],
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            except asyncio.TimeoutError:
                proc.kill()
                return ToolResult(ok=False, error=f"Konteyner zaman asimina ugradi ({timeout}s)")
                
            rc = proc.returncode if proc.returncode is not None else -1

            out = stdout.decode("utf-8", errors="ignore").strip()
            err = stderr.decode("utf-8", errors="ignore").strip()

            if rc == 0:
                return ToolResult(ok=True, output=out or "(konteyner cikti uretmedi)", data={"returncode": rc})
            return ToolResult(ok=False, error=f"Konteyner hata koduyla sonlandi ({rc}):\n{err}\n{out}")

        except Exception as exc:
            logger.exception("docker_sandbox_run hatasi")
            return ToolResult(ok=False, error=f"Docker sandbox baslatilirken sistem hatasi: {exc}")
