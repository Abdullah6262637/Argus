import platform
import sys
from app.services.tools.base import BaseTool, ToolContext, ToolResult


class SystemInfoTool(BaseTool):
    name = "system_info"
    description = "Sistemin işletim sistemi, Python sürümü ve mimari detaylarını güvenli bir şekilde döner."
    permission = "none"
    parameters = {
        "type": "object",
        "properties": {}
    }

    async def execute(self, args: dict, context: ToolContext) -> ToolResult:
        try:
            info = {
                "os": platform.system(),
                "os_release": platform.release(),
                "architecture": platform.machine(),
                "python_version": sys.version,
                "platform": platform.platform()
            }
            output_str = (
                f"Sistem Bilgileri:\n"
                f"- İşletim Sistemi: {info['os']} ({info['os_release']})\n"
                f"- Mimari: {info['architecture']}\n"
                f"- Python Sürümü: {info['python_version']}\n"
                f"- Platform Detayı: {info['platform']}"
            )
            return ToolResult(ok=True, output=output_str, data=info)
        except Exception as exc:
            return ToolResult(ok=False, error=f"Sistem bilgisi alınırken hata oluştu: {exc}")
