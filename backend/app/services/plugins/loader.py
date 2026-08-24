"""PluginLoader: plugins/ klasorundeki .py dosyalarindan BaseTool subclass'lari ithal et.

Guvenlik:
- Default: AST tabanli statik tarama ile tehlikeli import/cagrilari engeller
  (os.system, subprocess, eval, exec, __import__ vs.).
- Opsiyonel: RestrictedPython kuruluysa kod once compile_restricted ile
  derlenmeye calisir; ancak bizim plugin'lerimiz BaseTool subclass'i tanimi
  iceriyor (class+method) -- RestrictedPython'in default policy'si bunlari
  cogu zaman kabul etmez. Bu yuzden ASIL kontrol AST denetimidir.
- ALLOW_UNSAFE_PLUGINS=1 env degiskeni ile tarama bypass edilebilir.
"""
from __future__ import annotations

import ast
import importlib.util
import inspect
import logging
import os
from pathlib import Path
from typing import List, Set, Tuple

from app.services.tools.base import BaseTool

logger = logging.getLogger(__name__)


# Yasakli modul/objeler (tam ad eslesmesi)
_BLOCKED_MODULES: Set[str] = {
    "os.system",
    "os.popen",
    "os.exec",
    "os.execv",
    "os.execve",
    "os.execvp",
    "os.fork",
    "os.kill",
    "os.remove",
    "os.unlink",
    "os.rmdir",
    "os.removedirs",
    "shutil.rmtree",
    "ctypes"}

# Tamamen yasakli top-level moduller
_BLOCKED_TOPLEVEL: Set[str] = {
    "ctypes",
    "_ctypes",
    "subprocess",
    "pty",
    "shlex",
    "socket",
    "multiprocessing",
}

# Yasakli builtin cagrilar
_BLOCKED_CALLS: Set[str] = {
    "eval",
    "exec",
    "compile",
    "__import__",
    "open",
    "getattr",
    "setattr",
    "delattr",
    "globals",
    "locals",
    "vars",
}


class PluginSecurityError(Exception):
    pass


def _scan_ast(source: str, filename: str) -> Tuple[bool, str]:
    """Kaynak kodunu AST ile tara. (ok, error_message)."""
    try:
        tree = ast.parse(source, filename=filename)
    except SyntaxError as exc:
        return False, f"Syntax hatasi: {exc}"

    errors: List[str] = []

    for node in ast.walk(tree):
        # import x.y.z
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if top in _BLOCKED_TOPLEVEL:
                    errors.append(f"Yasakli import: {alias.name}")
        # from x.y import z
        elif isinstance(node, ast.ImportFrom):
            mod = node.module or ""
            top = mod.split(".")[0]
            if top in _BLOCKED_TOPLEVEL:
                errors.append(f"Yasakli import-from: {mod}")
            for alias in node.names:
                full = f"{mod}.{alias.name}" if mod else alias.name
                if full in _BLOCKED_MODULES:
                    errors.append(f"Yasakli sembol: {full}")
        # cagri: ad veya attribute
        elif isinstance(node, ast.Call):
            func = node.func
            # eval(...) gibi
            if isinstance(func, ast.Name) and func.id in _BLOCKED_CALLS:
                errors.append(f"Yasakli cagri: {func.id}()")
            # os.system(...) gibi
            if isinstance(func, ast.Attribute):
                # full path: a.b.c -> "a.b.c"
                parts: List[str] = []
                cur: ast.AST = func
                while isinstance(cur, ast.Attribute):
                    parts.append(cur.attr)
                    cur = cur.value
                if isinstance(cur, ast.Name):
                    parts.append(cur.id)
                    full = ".".join(reversed(parts))
                    if full in _BLOCKED_MODULES:
                        errors.append(f"Yasakli cagri: {full}()")
        # Tehlikeli dunder attribute erisimleri
        elif isinstance(node, ast.Attribute):
            if node.attr in ("__import__", "__builtins__", "__subclasses__", "__class__", "__bases__", "__globals__", "__code__"):
                errors.append(f"Yasakli attribute erisimi: .{node.attr}")

    if errors:
        return False, "; ".join(errors[:5])
    return True, ""


class PluginLoader:
    def __init__(self) -> None:
        self._loaded_modules: List[str] = []
        self._loaded_tools: List[str] = []

    @property
    def plugins_dir(self) -> Path:
        from app.config import get_settings
        return Path(get_settings().plugins_dir)

    @property
    def loaded_tools(self) -> List[str]:
        return list(self._loaded_tools)

    def _is_unsafe_bypass(self) -> bool:
        return os.environ.get("ALLOW_UNSAFE_PLUGINS") == "1"

    def load_all(self) -> int:
        """plugins/ altindaki tum .py dosyalarini yukle, BaseTool subclass'lari registry'e ekle.
        Return: kayit edilen tool sayisi.
        """
        plugins_dir = self.plugins_dir
        if not plugins_dir.exists():
            logger.info("Plugins klasoru yok, atlandi: %s", plugins_dir)
            return 0

        from app.services.tools.registry import tool_registry

        bypass = self._is_unsafe_bypass()
        if bypass:
            logger.warning(
                "ALLOW_UNSAFE_PLUGINS=1 -- plugin guvenlik taramasi DEVRE DISI"
            )

        count = 0
        for py_file in plugins_dir.glob("*.py"):
            if py_file.name.startswith("_"):
                continue

            # Statik guvenlik taramasi
            if not bypass:
                try:
                    source = py_file.read_text(encoding="utf-8")
                except Exception as exc:
                    logger.warning("Plugin okunamadi (%s): %s", py_file.name, exc)
                    continue
                ok, err = _scan_ast(source, py_file.name)
                if not ok:
                    logger.error(
                        "Plugin REDDEDILDI (%s): %s. "
                        "Bypass icin: ALLOW_UNSAFE_PLUGINS=1",
                        py_file.name,
                        err,
                    )
                    continue

            module_name = f"_plugins.{py_file.stem}"
            try:
                spec = importlib.util.spec_from_file_location(module_name, py_file)
                if not spec or not spec.loader:
                    continue
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                self._loaded_modules.append(module_name)

                # BaseTool subclass'larini bul ve register et
                for _, obj in inspect.getmembers(module, inspect.isclass):
                    if (
                        issubclass(obj, BaseTool)
                        and obj is not BaseTool
                        and obj.__module__ == module_name
                    ):
                        try:
                            instance = obj()
                            tool_registry.register(instance)
                            self._loaded_tools.append(instance.name)
                            count += 1
                            logger.info(
                                "Plugin tool yuklendi: %s (from %s)",
                                instance.name,
                                py_file.name,
                            )
                        except Exception as exc:
                            logger.warning(
                                "Plugin tool olusturulamadi (%s): %s", obj, exc
                            )
            except Exception as exc:
                logger.warning("Plugin yukleme hatasi (%s): %s", py_file.name, exc)

        if count:
            logger.info("Toplam %d plugin tool yuklendi", count)
        return count


# Singleton
plugin_loader = PluginLoader()