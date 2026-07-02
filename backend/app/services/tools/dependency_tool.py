"""InstallProjectDependencyTool: pip ve npm paket yukleyici."""
from __future__ import annotations

import asyncio
import logging
from pathlib import Path
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class InstallProjectDependencyTool(BaseTool):
    """Proje ortaminda pip veya npm paketlerini yukler."""

    name = "install_project_dependency"
    description = (
        "Projeye yeni bir bağımlılık (Python pip veya Node.js npm paketi) yükler. "
        "Ajan kod yazarken veya çalıştırırken eksik paket hatası aldığında bu aracı kullanmalıdır."
    )
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "manager": {
                "type": "string",
                "enum": ["pip", "npm"],
                "description": "Kullanılacak paket yöneticisi ('pip' veya 'npm')"
            },
            "package_name": {
                "type": "string",
                "description": "Yüklenecek paketin adı (örneğin 'numpy' veya 'lodash')"
            },
            "version": {
                "type": "string",
                "description": "İsteğe bağlı paket versiyonu (örneğin '1.24.0' veya '^4.17.21')"
            }
        },
        "required": ["manager", "package_name"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        manager = args.get("manager")
        package_name = (args.get("package_name") or "").strip()
        version = (args.get("version") or "").strip()

        if not package_name:
            return ToolResult(ok=False, error="Paket adi bos olamaz")

        # Basic shell injection check
        combined = package_name + version
        if not all(c.isalnum() or c in "-_@^./=+" for c in combined):
            return ToolResult(ok=False, error="Gecersiz paket adı veya versiyon karakterleri")

        spec = f"{package_name}=={version}" if version and manager == "pip" else (
            f"{package_name}@{version}" if version and manager == "npm" else package_name
        )

        cmd = []
        cwd = context.workspace_dir or "."
        
        if manager == "pip":
            import sys
            # Check if active virtualenv exists in workspace
            venv_pip = Path(cwd) / ".venv" / "Scripts" / "pip.exe"
            if not venv_pip.exists():
                venv_pip = Path(cwd) / ".venv" / "bin" / "pip"
            
            cmd_exec = str(venv_pip) if venv_pip.exists() else sys.executable
            if venv_pip.exists():
                cmd = [cmd_exec, "install", spec]
            else:
                cmd = [cmd_exec, "-m", "pip", "install", spec]
        elif manager == "npm":
            cmd = ["npm", "install", spec]
        else:
            return ToolResult(ok=False, error=f"Bilinmeyen paket yoneticisi: {manager}")

        try:
            proc = await asyncio.create_subprocess_exec(
                cmd[0], *cmd[1:],
                cwd=cwd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
            )
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=90.0)
            rc = proc.returncode if proc.returncode is not None else -1
            
            out = stdout.decode("utf-8", errors="ignore").strip()
            err = stderr.decode("utf-8", errors="ignore").strip()

            if rc == 0:
                return ToolResult(
                    ok=True,
                    output=f"'{spec}' basariyla yuklendi.\n{out}",
                    data={"returncode": rc}
                )
                
            return ToolResult(
                ok=False,
                error=f"Paket yukleme basarisiz ({rc}):\n{err}\n{out}"
            )
        except Exception as exc:
            logger.exception("install_project_dependency hatasi")
            return ToolResult(ok=False, error=f"Paket yuklenirken sistem hatası: {exc}")
