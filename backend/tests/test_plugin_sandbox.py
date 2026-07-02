"""Plugin sandbox AST tarayicisi testleri."""
from __future__ import annotations

from app.services.plugins.loader import _scan_ast


def test_scan_allows_safe_code() -> None:
    src = """
from app.services.tools.base import BaseTool, ToolResult

class HelloTool(BaseTool):
    name = "hello"
    description = "selam"
    async def execute(self, args, context):
        return ToolResult(ok=True, output="merhaba")
"""
    ok, err = _scan_ast(src, "hello.py")
    assert ok, f"Beklenmedik red: {err}"


def test_scan_blocks_os_system() -> None:
    src = "import os\nos.system('dir')\n"
    ok, err = _scan_ast(src, "evil.py")
    assert not ok
    assert "os.system" in err


def test_scan_blocks_eval() -> None:
    src = "x = eval('1+1')\n"
    ok, err = _scan_ast(src, "evil.py")
    assert not ok
    assert "eval" in err.lower()


def test_scan_blocks_subprocess_via_ctypes() -> None:
    src = "import ctypes\n"
    ok, err = _scan_ast(src, "evil.py")
    assert not ok


def test_scan_blocks_underscore_import() -> None:
    src = "x = __import__('os')\n"
    ok, err = _scan_ast(src, "evil.py")
    assert not ok
    assert "__import__" in err


def test_scan_blocks_shutil_rmtree() -> None:
    src = "from shutil import rmtree\nrmtree('/')\n"
    ok, err = _scan_ast(src, "evil.py")
    assert not ok
    assert "shutil.rmtree" in err


def test_scan_reports_syntax_error() -> None:
    src = "def broken(:\n"
    ok, err = _scan_ast(src, "broken.py")
    assert not ok
    assert "Syntax" in err