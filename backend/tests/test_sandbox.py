import pytest
from app.services.security.sandbox import check_sandbox
from app.config import get_settings

def test_safe_commands_allowed(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "run_command_allowlist", "echo,ls,git")
    
    ok, err = check_sandbox("run_command", {"command": "echo hello"})
    assert ok is True
    assert err == ""

    ok, err = check_sandbox("run_command", {"command": "ls -la"})
    assert ok is True
    assert err == ""

def test_dangerous_commands_blocked(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "run_command_allowlist", "echo,ls,git")
    
    ok, err = check_sandbox("run_command", {"command": "rm -rf /"})
    assert ok is False
    assert "allowlist" in err or "engellenmiştir" in err

    ok, err = check_sandbox("run_command", {"command": "format C:"})
    assert ok is False
    assert "allowlist" in err or "engellenmiştir" in err

def test_shell_injection_prevention(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "run_command_allowlist", "echo,ls,git")
    
    # Test semicolon injection
    ok, err = check_sandbox("run_command", {"command": "echo hello; rm -rf /"})
    assert ok is False
    assert "Shell injection" in err or "yönlendirme" in err

    # Test AND operator injection
    ok, err = check_sandbox("run_command", {"command": "echo hello && ls"})
    assert ok is False
    assert "Shell injection" in err or "yönlendirme" in err
    
    # Test OR operator injection
    ok, err = check_sandbox("run_command", {"command": "echo hello || ls"})
    assert ok is False
    assert "Shell injection" in err or "yönlendirme" in err
    
    # Test pipeline injection
    ok, err = check_sandbox("run_command", {"command": "echo hello | ls"})
    assert ok is False
    assert "Shell injection" in err or "yönlendirme" in err

    # Test subshell injection
    ok, err = check_sandbox("run_command", {"command": "echo $(ls)"})
    assert ok is False
    assert "Shell injection" in err or "ikame" in err

def test_python_c_and_eval_blocking(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "run_command_allowlist", "python,node,npm")
    
    ok, err = check_sandbox("run_command", {"command": "python -c 'print(1)'"})
    assert ok is False
    assert "engellenmiştir" in err

    ok, err = check_sandbox("run_command", {"command": "node -e 'console.log(1)'"})
    assert ok is False
    assert "engellenmiştir" in err
    
    ok, err = check_sandbox("run_command", {"command": "npm i something"})
    assert ok is False
    assert "engellenmiştir" in err