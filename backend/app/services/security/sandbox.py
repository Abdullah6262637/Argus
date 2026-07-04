"""Sandbox: komut allowlist + cwd jail (FAZ 7.1)."""
from __future__ import annotations

import logging
import shlex
from pathlib import Path
from typing import Any, Dict, Tuple

from app.config import get_settings
from app.services.security.path_utils import expand_path as _expand_path

logger = logging.getLogger(__name__)


def _parse_allowlist() -> list[str]:
    settings = get_settings()
    raw = (settings.run_command_allowlist or "").strip()
    if not raw or raw == "*":
        return []  # bos = serbest
    return [x.strip().lower() for x in raw.split(",") if x.strip()]


def _parse_cwd_jail() -> Path | None:
    settings = get_settings()
    raw = (settings.run_command_cwd_jail or "").strip()
    if not raw:
        return None
    return _expand_path(raw)


def _extract_command(args: Dict[str, Any]) -> str:
    """run_command tool'unun args dict'inden komutu cikar."""
    for key in ("command", "cmd", "args", "shell"):
        v = args.get(key)
        if isinstance(v, str) and v.strip():
            return v.strip()
        if isinstance(v, list) and v:
            return " ".join(str(x) for x in v)
    return ""


def check_sandbox(tool_name: str, args: Dict[str, Any]) -> Tuple[bool, str]:
    """Tool/argument'lara karsi sandbox kurallarini kontrol et.
    
    Return: (ok, error_message). Sadece run_command/dosya tool'lari icin etki eder.
    """
    settings = get_settings()
    if tool_name == "run_command":
        cmd = _extract_command(args)
        if not cmd:
            return True, ""

        # Allowlist
        allowlist = _parse_allowlist()
        if allowlist:
            # Prevent command chaining/injection operators in command string
            injection_chars = [";", "&&", "||", "|", "\n", "\r"]
            # Look for these characters outside of quotes, but to be extremely safe, check entire string for raw chaining
            # We want to allow commands like git log -n 1, but reject git status && rm -rf /
            for char in injection_chars:
                if char in cmd:
                    return False, f"Komut zincirleme veya yönlendirme karakterleri içeremez: '{char}' (Shell injection koruması)."

            try:
                tokens = shlex.split(cmd, posix=False)
            except ValueError:
                tokens = cmd.split()
            if not tokens:
                return False, "Bos komut"
            first = tokens[0].lower()
            # Path strip
            first_name = Path(first).name.lower()
            # .exe ekini at
            for stripped in (first, first_name, first.removesuffix(".exe"), first_name.removesuffix(".exe")):
                if stripped in allowlist:
                    break
            else:
                return False, (
                    f"Komut allowlist'te degil: '{first}'. "
                    f"Izin verilenler: {', '.join(allowlist)}"
                )

        # Cwd jail
        jail = _parse_cwd_jail()
        if jail is not None:
            cwd_arg = args.get("cwd")
            if cwd_arg:
                cwd_path = _expand_path(cwd_arg)
                try:
                    cwd_path.relative_to(jail)
                except ValueError:
                    return False, f"cwd cwd_jail disinda: {cwd_path} (jail: {jail})"

    # Dosya tool'lari icin cwd jail
    if tool_name in ("read_file", "write_file", "append_file", "delete_file",
                     "copy_file", "move_file", "mkdir", "list_dir", "search_files"):
        jail = _parse_cwd_jail()
        if jail is not None:
            for key in ("path", "src", "dst", "dir", "root", "directory"):
                v = args.get(key)
                if isinstance(v, str) and v:
                    target = _expand_path(v)
                    try:
                        target.relative_to(jail)
                    except ValueError:
                        return False, f"Yol jail disinda ({key}): {target} (jail: {jail})"

    return True, ""