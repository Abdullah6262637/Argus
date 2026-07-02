"""Sistem seviyesinde tool'lar: run_command, open_app, system_info."""
from __future__ import annotations

import asyncio
import logging
import os
import platform
import shutil
import subprocess
import time
from typing import Any, Dict, List, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


# ============================================================
# Windows pencere one cikarma yardimcilari
# ============================================================

def _bring_window_foreground_win(pid: int, timeout_sec: float = 5.0) -> bool:
    """Verilen PID'in pencerelerini One Cikar (Windows).
    
    Foreground lock'u ASFW_ANY ile devre disi birakir, sonra SetForegroundWindow
    ve ShowWindow(SW_RESTORE) cagirir. Pencere acilmasini bekler.
    """
    if platform.system().lower() != "windows":
        return False
    try:
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32

        SW_RESTORE = 9
        SW_SHOW = 5
        ASFW_ANY = -1

        # Foreground lock'u kaldir (caller process'e izin ver)
        try:
            user32.AllowSetForegroundWindow(ASFW_ANY)
        except Exception:
            pass

        EnumWindows = user32.EnumWindows
        EnumWindowsProc = ctypes.WINFUNCTYPE(
            ctypes.c_bool, wintypes.HWND, wintypes.LPARAM
        )
        GetWindowThreadProcessId = user32.GetWindowThreadProcessId
        IsWindowVisible = user32.IsWindowVisible
        GetWindow = user32.GetWindow
        SetForegroundWindow = user32.SetForegroundWindow
        ShowWindow = user32.ShowWindow
        BringWindowToTop = user32.BringWindowToTop
        SwitchToThisWindow = user32.SwitchToThisWindow

        deadline = time.time() + timeout_sec
        target_hwnd: Optional[int] = None

        def enum_handler(hwnd, _):
            nonlocal target_hwnd
            if not IsWindowVisible(hwnd):
                return True
            wpid = wintypes.DWORD()
            GetWindowThreadProcessId(hwnd, ctypes.byref(wpid))
            if wpid.value == pid:
                # Sahip pencerelerden ana pencereyi al
                # GW_OWNER = 4 -> sahibini al; sahibi olmayan asal penceredir
                owner = GetWindow(hwnd, 4)
                if not owner:
                    target_hwnd = hwnd
                    return False  # bulduk, dur
            return True

        # Pencere acilana kadar bekle (process yeni baslamis olabilir)
        while time.time() < deadline:
            target_hwnd = None
            EnumWindows(EnumWindowsProc(enum_handler), 0)
            if target_hwnd:
                break
            time.sleep(0.15)

        if not target_hwnd:
            logger.debug("foreground: PID %s icin pencere bulunamadi", pid)
            return False

        # Restore + foreground
        try:
            ShowWindow(target_hwnd, SW_RESTORE)
        except Exception:
            pass
        try:
            BringWindowToTop(target_hwnd)
        except Exception:
            pass
        ok = bool(SetForegroundWindow(target_hwnd))
        if not ok:
            # Son care: SwitchToThisWindow - daha "kuvvetli"
            try:
                SwitchToThisWindow(target_hwnd, True)
                ok = True
            except Exception:
                pass
        return ok
    except Exception as exc:
        logger.debug("foreground hatasi: %s", exc)
        return False


def _focus_by_title_win(title_substr: str, timeout_sec: float = 4.0) -> bool:
    """Baslik substring'ine gore pencereyi one cikar (Windows fallback)."""
    if platform.system().lower() != "windows":
        return False
    try:
        import ctypes
        from ctypes import wintypes

        user32 = ctypes.windll.user32
        EnumWindows = user32.EnumWindows
        EnumWindowsProc = ctypes.WINFUNCTYPE(ctypes.c_bool, wintypes.HWND, wintypes.LPARAM)
        IsWindowVisible = user32.IsWindowVisible
        GetWindowTextW = user32.GetWindowTextW
        GetWindowTextLengthW = user32.GetWindowTextLengthW
        SetForegroundWindow = user32.SetForegroundWindow
        ShowWindow = user32.ShowWindow
        SW_RESTORE = 9

        target_hwnd = None
        needle = title_substr.lower()

        def enum_handler(hwnd, _):
            nonlocal target_hwnd
            if not IsWindowVisible(hwnd):
                return True
            length = GetWindowTextLengthW(hwnd)
            if length == 0:
                return True
            buf = ctypes.create_unicode_buffer(length + 1)
            GetWindowTextW(hwnd, buf, length + 1)
            if needle in buf.value.lower():
                target_hwnd = hwnd
                return False
            return True

        deadline = time.time() + timeout_sec
        while time.time() < deadline:
            target_hwnd = None
            EnumWindows(EnumWindowsProc(enum_handler), 0)
            if target_hwnd:
                break
            time.sleep(0.2)

        if not target_hwnd:
            return False
        try:
            ShowWindow(target_hwnd, SW_RESTORE)
        except Exception:
            pass
        return bool(SetForegroundWindow(target_hwnd))
    except Exception:
        return False


class RunCommandTool(BaseTool):
    """Sistem terminalinde shell komutu calistirir."""

    name = "run_command"
    description = (
        "Kullanicinin isletim sisteminde (Windows/macOS/Linux) bir shell komutu calistirir "
        "ve cikti+exit code doner. Dosya islemleri, git komutlari, paket kurulumu gibi "
        "operasyonlar icin kullan. Cok uzun veya tehlikeli komutlardan kacin."
    )
    permission = "terminal_cmd"
    requires_confirmation = False  # Istenirse True yapilabilir
    parameters = {
        "type": "object",
        "properties": {
            "command": {
                "type": "string",
                "description": "Calistirilacak komut. orn. 'dir', 'ls -la', 'git status'."},
            "cwd": {
                "type": "string",
                "description": "(opsiyonel) Komutun calistirilacagi dizin."},
            "timeout_sec": {
                "type": "integer",
                "description": "Maksimum bekleme suresi (saniye, varsayilan 30).",
                "default": 30}},
        "required": ["command"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        command = (args.get("command") or "").strip()
        if not command:
            return ToolResult(ok=False, error="Komut bos olamaz")

        cwd = args.get("cwd") or None
        timeout = int(args.get("timeout_sec") or 30)
        timeout = max(1, min(timeout, 300))

        try:
            proc = await asyncio.create_subprocess_shell(
                command,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=cwd,
            )
            try:
                stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            except asyncio.TimeoutError:
                proc.kill()
                await proc.wait()
                return ToolResult(
                    ok=False,
                    error=f"Komut zaman asimina ugradi ({timeout}s): {command}",
                )
        except Exception as exc:
            logger.exception("run_command hatasi")
            return ToolResult(ok=False, error=f"Komut calistirilamadi: {exc}")

        out = stdout.decode("utf-8", errors="replace") if stdout else ""
        err = stderr.decode("utf-8", errors="replace") if stderr else ""
        rc = proc.returncode if proc.returncode is not None else -1

        parts: List[str] = [f"$ {command}", f"(exit code: {rc})"]
        if out.strip():
            parts.append(f"STDOUT:\n{out.strip()}")
        if err.strip():
            parts.append(f"STDERR:\n{err.strip()}")

        return ToolResult(
            ok=(rc == 0),
            output="\n\n".join(parts),
            error=None if rc == 0 else f"Exit code {rc}",
            data={"command": command, "exit_code": rc, "stdout": out, "stderr": err},
        )


class OpenAppTool(BaseTool):
    """Yerel bir uygulama veya dosya acar VE penceresini one cikarir."""

    name = "open_app"
    description = (
        "Yerel bilgisayardaki bir uygulamayi veya dosyayi acar VE penceresini "
        "ON PLANA (foreground) getirir. Windows'ta PowerShell Start-Process -PassThru "
        "+ Win32 SetForegroundWindow ile pencereyi one cikarir; arka planda kalmaz. "
        "macOS 'open -a', Linux 'xdg-open' (+ 'wmctrl' varsa). "
        "Ornek: 'notepad', 'calc', 'code', 'C:/Users/me/Desktop/foo.txt'."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "target": {
                "type": "string",
                "description": "Uygulama adi veya dosya yolu (orn. 'notepad', 'C:/foo.txt')."},
            "no_focus": {
                "type": "boolean",
                "description": "True ise pencere one getirilmez (sessiz arka plan acma).",
                "default": False}},
        "required": ["target"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        target = (args.get("target") or "").strip()
        no_focus = bool(args.get("no_focus", False))
        if not target:
            return ToolResult(ok=False, error="Hedef bos olamaz")

        system = platform.system().lower()
        pid: Optional[int] = None
        focused = False

        try:
            if system == "windows":
                # PowerShell Start-Process -PassThru -> PID alabiliyoruz.
                # Komut tirnak escape: target icindeki ' karakterini ikileyelim.
                safe_target = target.replace("'", "''")
                ps_cmd = (
                    f"$ErrorActionPreference='Stop'; "
                    f"$p = Start-Process -FilePath '{safe_target}' -PassThru; "
                    f"$p.Id"
                )
                proc = await asyncio.create_subprocess_exec(
                    "powershell", "-NoProfile", "-Command", ps_cmd,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, stderr = await proc.communicate()
                pid_str = (stdout.decode("utf-8", errors="replace") or "").strip()
                err_str = (stderr.decode("utf-8", errors="replace") or "").strip()
                if pid_str.isdigit():
                    pid = int(pid_str)
                elif err_str:
                    logger.debug("Start-Process hatasi: %s; 'start' fallback", err_str)

                # Fallback: shell start (PID alamayiz ama acilir)
                if pid is None:
                    fb = await asyncio.create_subprocess_shell(
                        f'start "" "{target}"',
                        stdout=asyncio.subprocess.PIPE,
                        stderr=asyncio.subprocess.PIPE,
                    )
                    await fb.communicate()

                # One cikarma
                if not no_focus:
                    loop = asyncio.get_event_loop()
                    if pid is not None:
                        focused = await loop.run_in_executor(
                            None, _bring_window_foreground_win, pid, 5.0
                        )
                    if not focused:
                        # Title fallback - executable adina gore arama
                        guess = os.path.splitext(os.path.basename(target))[0]
                        if guess:
                            focused = await loop.run_in_executor(
                                None, _focus_by_title_win, guess, 4.0
                            )

            elif system == "darwin":
                # macOS 'open -a' default olarak uygulamayi one getirir
                proc = await asyncio.create_subprocess_exec(
                    "open", "-a", target,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                focused = True

            else:
                # Linux: xdg-open + wmctrl ile foreground (varsa)
                proc = await asyncio.create_subprocess_exec(
                    "xdg-open", target,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                await proc.communicate()
                if not no_focus and shutil.which("wmctrl"):
                    guess = os.path.splitext(os.path.basename(target))[0]
                    if guess:
                        try:
                            await asyncio.sleep(0.5)
                            wm = await asyncio.create_subprocess_exec(
                                "wmctrl", "-a", guess,
                                stdout=asyncio.subprocess.PIPE,
                                stderr=asyncio.subprocess.PIPE,
                            )
                            await wm.communicate()
                            focused = wm.returncode == 0
                        except Exception:
                            pass

            msg = f"'{target}' acildi"
            if focused:
                msg += " ve one cikarildi"
            elif not no_focus:
                msg += " (one cikarilamadi - UAC veya foreground lock olabilir)"
            return ToolResult(
                ok=True,
                output=msg + ".",
                data={
                    "target": target,
                    "platform": system,
                    "pid": pid,
                    "focused": focused},
            )
        except Exception as exc:
            logger.exception("open_app hatasi")
            return ToolResult(ok=False, error=f"'{target}' acilamadi: {exc}")


class SystemInfoTool(BaseTool):
    """Isletim sistemi, CPU, bellek ve disk bilgilerini doner."""

    name = "system_info"
    description = (
        "Kullanicinin bilgisayari hakkinda temel bilgileri doner: "
        "OS, CPU, RAM, disk kullanimi, calisma dizini. "
        "Kullanici 'hangi sistemdeyim', 'kac GB ramim var' gibi sorular sordugunda kullan."
    )
    permission = "none"
    parameters = {"type": "object", "properties": {}, "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import psutil  # type: ignore
        except ImportError:
            psutil = None  # type: ignore

        info: Dict[str, Any] = {
            "platform": platform.platform(),
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "processor": platform.processor() or "unknown",
            "python_version": platform.python_version(),
            "cwd": os.getcwd(),
            "user": os.environ.get("USERNAME") or os.environ.get("USER") or "unknown"}

        if psutil:
            try:
                vm = psutil.virtual_memory()
                info["ram_total_gb"] = round(vm.total / (1024 ** 3), 2)
                info["ram_available_gb"] = round(vm.available / (1024 ** 3), 2)
                info["cpu_count"] = psutil.cpu_count(logical=True)
                info["cpu_percent"] = psutil.cpu_percent(interval=0.2)
                disk = psutil.disk_usage(os.getcwd())
                info["disk_total_gb"] = round(disk.total / (1024 ** 3), 2)
                info["disk_free_gb"] = round(disk.free / (1024 ** 3), 2)
            except Exception:
                pass

        lines = [f"{k}: {v}" for k, v in info.items()]
        return ToolResult(ok=True, output="\n".join(lines), data=info)