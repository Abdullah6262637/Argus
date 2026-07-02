"""Sandbox (komut allowlist + cwd jail) testleri."""
from __future__ import annotations

import os
from pathlib import Path

import pytest

from app.services.security.sandbox import check_sandbox


@pytest.fixture(autouse=True)
def _clear_settings_cache():
    """Her test oncesi settings cache'i temizle (env override'larin etki etmesi icin)."""
    from app.config import get_settings
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_run_command_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RUN_COMMAND_ALLOWLIST", "echo,git")
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", "")
    ok, err = check_sandbox("run_command", {"command": "echo hello"})
    assert ok, err


def test_run_command_blocked(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RUN_COMMAND_ALLOWLIST", "echo,git")
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", "")
    ok, err = check_sandbox("run_command", {"command": "rm -rf /"})
    assert not ok
    assert "allowlist" in err.lower()


def test_run_command_empty_allowlist_means_open(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RUN_COMMAND_ALLOWLIST", "")
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", "")
    ok, err = check_sandbox("run_command", {"command": "anything --here"})
    assert ok, err


def test_cwd_jail_violation(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("RUN_COMMAND_ALLOWLIST", "")
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", str(tmp_path))
    other = tmp_path.parent
    ok, err = check_sandbox("run_command", {"command": "echo x", "cwd": str(other)})
    assert not ok
    assert "jail" in err.lower()


def test_cwd_jail_ok_inside(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("RUN_COMMAND_ALLOWLIST", "")
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", str(tmp_path))
    sub = tmp_path / "x"
    sub.mkdir()
    ok, err = check_sandbox("run_command", {"command": "echo", "cwd": str(sub)})
    assert ok, err


def test_file_tool_jail(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    monkeypatch.setenv("RUN_COMMAND_CWD_JAIL", str(tmp_path))
    other = tmp_path.parent / "outside.txt"
    ok, err = check_sandbox("read_file", {"path": str(other)})
    assert not ok
    assert "jail" in err.lower()