"""Git tool'lari (Sprint 3.1).

git CLI'yi subprocess ile sarmalayan tool'lar:
  - git_clone, git_pull, git_push, git_commit, git_status, git_diff
  - git_branch_list, git_branch_create, git_branch_switch, git_log

Permission: 'terminal_cmd' (git CLI'yi calistiriyor cunku).
Yuksek riskli olanlar (push, force, reset --hard) approval_service tarafindan
onay isteyebilir; istersek requires_confirmation=True yapariz.
"""
from __future__ import annotations

import asyncio
import shlex
from pathlib import Path
from typing import Any, Dict, List, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult


async def _run_git(
    args: List[str],
    cwd: Optional[str] = None,
    timeout: float = 60.0,
    env: Optional[Dict[str, str]] = None,
) -> ToolResult:
    """git komutunu calistir, ToolResult dondur."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "git", *args,
            cwd=cwd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env,
        )
        try:
            stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
        except asyncio.TimeoutError:
            proc.kill()
            return ToolResult(ok=False, error=f"git komutu zaman asimi ({timeout}s)")

        out = (stdout or b"").decode("utf-8", errors="replace").strip()
        err = (stderr or b"").decode("utf-8", errors="replace").strip()
        rc = proc.returncode if proc.returncode is not None else -1

        if rc == 0:
            return ToolResult(
                ok=True,
                output=out or "(islem basarili, cikti yok)",
                data={"returncode": rc, "stderr": err, "command": " ".join(["git"] + args)},
            )
        else:
            return ToolResult(
                ok=False,
                error=f"git rc={rc}: {err or out}",
                output=out,
                data={"returncode": rc, "stderr": err, "command": " ".join(["git"] + args)},
            )
    except FileNotFoundError:
        return ToolResult(ok=False, error="git CLI bulunamadi. Yuklemek icin: https://git-scm.com")
    except Exception as exc:
        return ToolResult(ok=False, error=f"git calistirma hatasi: {exc}")


def _validate_path(path: str) -> Optional[str]:
    """Path'i resolve et; gecersizse error string dondur."""
    try:
        p = Path(path).expanduser().resolve()
        if not p.exists():
            return f"Klasor yok: {p}"
        if not p.is_dir():
            return f"Yol klasor degil: {p}"
        # .git var mi? (clone disindaki tum komutlar icin)
        # Burada zorlamiyoruz, git zaten hata verir.
        return None
    except Exception as exc:
        return f"Gecersiz path: {exc}"


# ============================================================
# Tool sinifi
# ============================================================

class GitCloneTool(BaseTool):
    name = "git_clone"
    description = (
        "Bir git deposunu klonlar. URL ve hedef klasor parametre olarak verilir."
    )
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "url": {"type": "string", "description": "Repo URL (https veya ssh)"},
            "path": {"type": "string", "description": "Hedef klasor (varsayilan: repo adiyla klasor olusturur)"},
            "branch": {"type": "string", "description": "Klonlanacak branch (opsiyonel)"},
            "depth": {"type": "integer", "description": "Shallow clone derinligi (opsiyonel, ornek: 1)"}},
        "required": ["url"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        url = str(args.get("url") or "").strip()
        if not url:
            return ToolResult(ok=False, error="url zorunlu")
        path = args.get("path")
        branch = args.get("branch")
        depth = args.get("depth")
        cmd = ["clone"]
        if branch:
            cmd += ["-b", str(branch)]
        if isinstance(depth, int) and depth > 0:
            cmd += ["--depth", str(depth)]
        cmd.append(url)
        if path:
            cmd.append(str(path))
        return await _run_git(cmd, timeout=300.0)


class GitStatusTool(BaseTool):
    name = "git_status"
    description = "Bir git deposunun durumu (degisiklikler, branch, vb.) - 'git status' ozeti"
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "short": {"type": "boolean", "description": "Kisa format (varsayilan: True)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        short = bool(args.get("short", True))
        cmd = ["status"] + (["--short", "--branch"] if short else [])
        return await _run_git(cmd, cwd=path)


class GitPullTool(BaseTool):
    name = "git_pull"
    description = "Uzak depodan en son degisiklikleri cek (git pull)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "remote": {"type": "string", "description": "Remote adi (varsayilan: origin)"},
            "branch": {"type": "string", "description": "Branch adi (opsiyonel)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        remote = str(args.get("remote") or "origin")
        branch = args.get("branch")
        cmd = ["pull", remote]
        if branch:
            cmd.append(str(branch))
        return await _run_git(cmd, cwd=path, timeout=180.0)


class GitPushTool(BaseTool):
    name = "git_push"
    description = (
        "Yerel commit'leri uzak depoya gonder (git push). "
        "Bu islem geri alinmasi zor olabilir; dikkatli kullanin."
    )
    permission = "terminal_cmd"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "remote": {"type": "string", "description": "Remote adi (varsayilan: origin)"},
            "branch": {"type": "string", "description": "Branch adi (opsiyonel)"},
            "force": {"type": "boolean", "description": "Force push (TEHLIKELI, varsayilan: False)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        remote = str(args.get("remote") or "origin")
        branch = args.get("branch")
        force = bool(args.get("force", False))
        cmd = ["push"]
        if force:
            cmd.append("--force-with-lease")
        cmd.append(remote)
        if branch:
            cmd.append(str(branch))
        return await _run_git(cmd, cwd=path, timeout=180.0)


class GitCommitTool(BaseTool):
    name = "git_commit"
    description = (
        "Tüm değişiklikleri stage edip commit at. "
        "(git add -A && git commit -m <message>)"
    )
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "message": {"type": "string", "description": "Commit mesaji"},
            "add_all": {"type": "boolean", "description": "Tum degisiklikleri stage et (varsayilan: True)"},
            "files": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Sadece bu dosyalari stage et (add_all=False ise)"}},
        "required": ["path", "message"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        message = str(args.get("message") or "").strip()
        if not message:
            return ToolResult(ok=False, error="message zorunlu")
        add_all = bool(args.get("add_all", True))
        files = args.get("files") or []

        # Stage
        if add_all:
            r = await _run_git(["add", "-A"], cwd=path)
        elif files:
            r = await _run_git(["add"] + [str(f) for f in files], cwd=path)
        else:
            r = ToolResult(ok=True, output="(stage atlandi)")

        if not r.ok:
            return r

        # Commit
        return await _run_git(["commit", "-m", message], cwd=path)


class GitDiffTool(BaseTool):
    name = "git_diff"
    description = "Çalışan dizindeki veya iki referans arasındaki farkı göster."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "ref1": {"type": "string", "description": "Birinci referans (commit/branch). Bos ise unstaged."},
            "ref2": {"type": "string", "description": "Ikinci referans (opsiyonel)"},
            "staged": {"type": "boolean", "description": "Staged degisiklikleri goster (varsayilan: False)"},
            "max_chars": {"type": "integer", "description": "Cikti karakter limiti (varsayilan: 10000)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        ref1 = args.get("ref1")
        ref2 = args.get("ref2")
        staged = bool(args.get("staged", False))
        max_chars = int(args.get("max_chars", 10000))

        cmd = ["diff"]
        if staged:
            cmd.append("--cached")
        if ref1:
            cmd.append(str(ref1))
        if ref2:
            cmd.append(str(ref2))
        result = await _run_git(cmd, cwd=path)
        if result.ok and len(result.output) > max_chars:
            result.output = result.output[:max_chars] + f"\n...[{len(result.output) - max_chars} karakter kesildi]"
        return result


class GitBranchListTool(BaseTool):
    name = "git_branch_list"
    description = "Tum branch'leri listele (yerel + remote)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "all": {"type": "boolean", "description": "Remote branch'leri de goster (varsayilan: True)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        all_branches = bool(args.get("all", True))
        cmd = ["branch"] + (["-a"] if all_branches else [])
        return await _run_git(cmd, cwd=path)


class GitBranchSwitchTool(BaseTool):
    name = "git_branch_switch"
    description = "Bir branch'e gecis yap (git checkout/switch). create=True ise olusturur."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "branch": {"type": "string", "description": "Hedef branch adi"},
            "create": {"type": "boolean", "description": "Yoksa olustur (varsayilan: False)"}},
        "required": ["path", "branch"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        branch = str(args.get("branch") or "").strip()
        if not branch:
            return ToolResult(ok=False, error="branch zorunlu")
        create = bool(args.get("create", False))
        cmd = ["checkout"] + (["-b"] if create else []) + [branch]
        return await _run_git(cmd, cwd=path)


class GitLogTool(BaseTool):
    name = "git_log"
    description = "Son N commit'i ozet halinde goster."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Repo klasor yolu"},
            "limit": {"type": "integer", "description": "Maksimum commit sayisi (varsayilan: 20)"},
            "oneline": {"type": "boolean", "description": "Tek satir format (varsayilan: True)"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        err = _validate_path(path)
        if err:
            return ToolResult(ok=False, error=err)
        limit = int(args.get("limit", 20))
        oneline = bool(args.get("oneline", True))
        cmd = ["log", f"-{limit}"]
        if oneline:
            cmd.append("--oneline")
        else:
            cmd += ["--pretty=format:%h | %an | %ad | %s", "--date=short"]
        return await _run_git(cmd, cwd=path)


class GitInitTool(BaseTool):
    name = "git_init"
    description = "Verilen klasorde yeni bir git repo olustur (git init)."
    permission = "terminal_cmd"
    parameters = {
        "type": "object",
        "properties": {
            "path": {"type": "string", "description": "Klasor yolu"}},
        "required": ["path"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        path = str(args.get("path") or "")
        try:
            p = Path(path).expanduser().resolve()
            p.mkdir(parents=True, exist_ok=True)
        except Exception as exc:
            return ToolResult(ok=False, error=f"Klasor olusturulamadi: {exc}")
        return await _run_git(["init"], cwd=str(p))