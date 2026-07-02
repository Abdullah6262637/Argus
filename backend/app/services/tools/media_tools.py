"""Sesli okuma, bildirim ve uyari tool'lari."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class TextToSpeechTool(BaseTool):
    name = "text_to_speech"
    description = (
        "Verilen metni sesli olarak okur (sistem TTS motoru ile). "
        "Windows'ta SAPI, macOS'ta 'say', Linux'ta 'espeak' kullanir."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string"},
            "lang": {
                "type": "string",
                "description": "(opsiyonel) Dil kodu (tr-TR, en-US...)",
                "default": "tr-TR"}},
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        text = (args.get("text") or "").strip()
        if not text:
            return ToolResult(ok=False, error="text bos olamaz")
        try:
            await asyncio.get_event_loop().run_in_executor(None, self._speak_sync, text)
            return ToolResult(ok=True, output=f"Okundu ({len(text)} char).", data={"length": len(text)})
        except Exception as exc:
            return ToolResult(ok=False, error=f"TTS basarisiz: {exc}")

    @staticmethod
    def _speak_sync(text: str) -> None:
        import platform
        sys = platform.system().lower()
        if sys == "windows":
            try:
                # PowerShell SAPI yontemi - encoding sorunlarindan kacin
                import subprocess
                ps = (
                    "Add-Type -AssemblyName System.Speech;"
                    "$s=New-Object System.Speech.Synthesis.SpeechSynthesizer;"
                    f"$s.Speak([Console]::In.ReadToEnd())"
                )
                subprocess.run(
                    ["powershell", "-NoProfile", "-Command", ps],
                    input=text.encode("utf-16-le"),
                    check=False,
                )
            except Exception:
                pass
        elif sys == "darwin":
            import subprocess
            subprocess.run(["say", text], check=False)
        else:
            import subprocess
            subprocess.run(["espeak", text], check=False)


class ShowNotificationTool(BaseTool):
    name = "show_notification"
    description = "Sistem bildirimi (toast) gosterir."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "title": {"type": "string", "default": "UmtalAgent"},
            "message": {"type": "string"}},
        "required": ["message"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        title = args.get("title") or "UmtalAgent"
        message = args.get("message") or ""
        if not message:
            return ToolResult(ok=False, error="message bos olamaz")
        try:
            await asyncio.get_event_loop().run_in_executor(
                None, self._notify_sync, title, message
            )
            return ToolResult(ok=True, output=f"Bildirim gosterildi: {title}")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Bildirim hatasi: {exc}")

    @staticmethod
    def _notify_sync(title: str, message: str) -> None:
        import platform
        sys = platform.system().lower()
        if sys == "windows":
            try:
                import subprocess
                # PowerShell BurntToast yoksa basic balloon notification
                ps = (
                    "[Windows.UI.Notifications.ToastNotificationManager,"
                    "Windows.UI.Notifications,ContentType=WindowsRuntime] | Out-Null;"
                    f"$xml=[Windows.UI.Notifications.ToastNotificationManager]::"
                    f"GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02);"
                    f"$tn=$xml.GetElementsByTagName('text');"
                    f"$tn[0].AppendChild($xml.CreateTextNode('{title}'))|Out-Null;"
                    f"$tn[1].AppendChild($xml.CreateTextNode('{message}'))|Out-Null;"
                    f"$t=[Windows.UI.Notifications.ToastNotification]::new($xml);"
                    f"[Windows.UI.Notifications.ToastNotificationManager]::"
                    f"CreateToastNotifier('UmtalAgent').Show($t);"
                )
                subprocess.run(["powershell", "-NoProfile", "-Command", ps], check=False)
            except Exception:
                # Fallback: msgbox
                try:
                    import ctypes
                    ctypes.windll.user32.MessageBoxW(0, message, title, 0x40)
                except Exception:
                    pass
        elif sys == "darwin":
            import subprocess
            script = f'display notification "{message}" with title "{title}"'
            subprocess.run(["osascript", "-e", script], check=False)
        else:
            import subprocess
            subprocess.run(["notify-send", title, message], check=False)


class PlayBeepTool(BaseTool):
    name = "play_beep"
    description = "Sistem uyari sesi (beep) calar."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "frequency": {"type": "integer", "default": 800, "description": "Hz"},
            "duration_ms": {"type": "integer", "default": 300}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        freq = int(args.get("frequency") or 800)
        dur = int(args.get("duration_ms") or 300)
        try:
            await asyncio.get_event_loop().run_in_executor(None, self._beep_sync, freq, dur)
            return ToolResult(ok=True, output=f"Beep ({freq}Hz, {dur}ms)")
        except Exception as exc:
            return ToolResult(ok=False, error=f"Beep hatasi: {exc}")

    @staticmethod
    def _beep_sync(freq: int, dur: int) -> None:
        import platform
        if platform.system().lower() == "windows":
            try:
                import winsound
                winsound.Beep(freq, dur)
            except Exception:
                pass
        else:
            print("\a", flush=True)