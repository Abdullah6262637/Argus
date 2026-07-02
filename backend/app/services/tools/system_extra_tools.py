"""Genisletilmis sistem tool'lari: datetime, lock, volume, shutdown."""
from __future__ import annotations

import asyncio
import logging
import platform
from datetime import datetime
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class GetDateTimeTool(BaseTool):
    name = "get_datetime"
    description = "Su anki tarih ve saati doner (yerel zaman dilimi)."
    permission = "none"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        now = datetime.now()
        out = now.strftime("%Y-%m-%d %H:%M:%S (%A)")
        return ToolResult(
            ok=True,
            output=f"Su an: {out}",
            data={
                "iso": now.isoformat(),
                "year": now.year,
                "month": now.month,
                "day": now.day,
                "hour": now.hour,
                "minute": now.minute,
                "weekday": now.strftime("%A")},
        )


class LockScreenTool(BaseTool):
    name = "lock_screen"
    description = "Bilgisayarin ekranini kilitler."
    permission = "system_admin"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        sys = platform.system().lower()
        try:
            if sys == "windows":
                await asyncio.create_subprocess_shell("rundll32.exe user32.dll,LockWorkStation")
            elif sys == "darwin":
                await asyncio.create_subprocess_shell(
                    "/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend"
                )
            else:
                await asyncio.create_subprocess_shell("loginctl lock-session")
            return ToolResult(ok=True, output="Ekran kilitlendi.")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Kilit basarisiz: {exc}")


class SetVolumeTool(BaseTool):
    name = "set_volume"
    description = "Sistem ses seviyesini ayarlar (0-100)."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {"level": {"type": "integer", "minimum": 0, "maximum": 100}},
        "required": ["level"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        level = max(0, min(100, int(args.get("level") or 0)))
        sys = platform.system().lower()
        try:
            if sys == "windows":
                # nircmd yoksa pyautogui ile volume tuslari kullanmak kolay degil
                # Yerine PowerShell + WPF SetVolume API
                ps = (
                    f"$obj = New-Object -ComObject WScript.Shell;"
                    f"1..50 | %{{ $obj.SendKeys([char]174) }};"
                    f"1..{level // 2} | %{{ $obj.SendKeys([char]175) }}"
                )
                proc = await asyncio.create_subprocess_shell(
                    f'powershell -NoProfile -Command "{ps}"'
                )
                await proc.communicate()
            elif sys == "darwin":
                proc = await asyncio.create_subprocess_shell(
                    f'osascript -e "set volume output volume {level}"'
                )
                await proc.communicate()
            else:
                proc = await asyncio.create_subprocess_shell(f"amixer set Master {level}%")
                await proc.communicate()
            return ToolResult(ok=True, output=f"Ses seviyesi: {level}%")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Ses ayari basarisiz: {exc}")


class ShutdownTool(BaseTool):
    name = "shutdown"
    description = (
        "Bilgisayari kapatir, yeniden baslatir veya uyku moduna alir. "
        "DIKKAT: Geri alinamaz; mutlaka kullaniciya teyit ettir."
    )
    permission = "system_admin"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["shutdown", "restart", "sleep", "logoff"],
                "default": "shutdown"},
            "delay_sec": {"type": "integer", "default": 10}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        action = args.get("action") or "shutdown"
        delay = max(0, int(args.get("delay_sec") or 10))
        sys = platform.system().lower()
        try:
            cmd = ""
            if sys == "windows":
                if action == "shutdown":
                    cmd = f"shutdown /s /t {delay}"
                elif action == "restart":
                    cmd = f"shutdown /r /t {delay}"
                elif action == "sleep":
                    cmd = "rundll32.exe powrprof.dll,SetSuspendState 0,1,0"
                elif action == "logoff":
                    cmd = "shutdown /l"
            elif sys == "darwin":
                if action == "shutdown":
                    cmd = f"sudo shutdown -h +{delay // 60}"
                elif action == "restart":
                    cmd = f"sudo shutdown -r +{delay // 60}"
                elif action == "sleep":
                    cmd = "pmset sleepnow"
            else:
                if action == "shutdown":
                    cmd = f"shutdown -h +{delay // 60}"
                elif action == "restart":
                    cmd = f"shutdown -r +{delay // 60}"
                elif action == "sleep":
                    cmd = "systemctl suspend"
            if not cmd:
                return ToolResult(ok=False, error=f"Desteklenmeyen action: {action}")
            await asyncio.create_subprocess_shell(cmd)
            return ToolResult(
                ok=True,
                output=f"'{action}' planlandi (delay={delay}s).",
                data={"action": action, "delay_sec": delay},
            )
        except Exception as exc:
            return ToolResult(ok=False, error=f"Shutdown hatasi: {exc}")


class CancelShutdownTool(BaseTool):
    name = "cancel_shutdown"
    description = "Planli shutdown/restart islemini iptal eder."
    permission = "system_admin"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        sys = platform.system().lower()
        try:
            if sys == "windows":
                await asyncio.create_subprocess_shell("shutdown /a")
            else:
                await asyncio.create_subprocess_shell("shutdown -c")
            return ToolResult(ok=True, output="Planli kapatma iptal edildi.")
        except Exception as exc:
            return ToolResult(ok=False, error=str(exc))