"""GitHubAPITool: GitHub REST API sarmalayicisi."""
from __future__ import annotations

import logging
import os
from typing import Any, Dict

import httpx

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


class GitHubAPITool(BaseTool):
    """GitHub API entegrasyonu."""

    name = "github_api"
    description = (
        "GitHub API'si üzerinden depo (repo) işlemleri gerçekleştirir. "
        "Issue listeleme, yorum ekleme, Pull Request (PR) sorgulama ve PR oluşturma için kullan."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["list_issues", "create_issue", "list_prs", "create_pr", "add_comment"],
                "description": "Yapılacak işlem"
            },
            "repo": {
                "type": "string",
                "description": "Uzak depo yolu (örneğin 'octocat/Hello-World')"
            },
            "title": {
                "type": "string",
                "description": "Issue veya PR başlığı"
            },
            "body": {
                "type": "string",
                "description": "Issue, PR veya yorum içeriği"
            },
            "number": {
                "type": "integer",
                "description": "Yorum eklenecek veya sorgulanacak Issue/PR numarası"
            },
            "head": {
                "type": "string",
                "description": "PR için kaynak branch adı (örneğin 'feature-branch')"
            },
            "base": {
                "type": "string",
                "description": "PR için hedef branch adı (varsayılan 'main')",
                "default": "main"
            }
        },
        "required": ["action", "repo"]
    }

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        action = args.get("action")
        repo = (args.get("repo") or "").strip()
        title = (args.get("title") or "").strip()
        body = (args.get("body") or "").strip()
        number = args.get("number")
        head = (args.get("head") or "").strip()
        base = (args.get("base") or "main").strip()

        token = os.environ.get("GITHUB_TOKEN") or context.extra.get("github_token")
        
        headers = {
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "UmtalAgent"
        }
        if token:
            headers["Authorization"] = f"Bearer {token}"

        url = f"https://api.github.com/repos/{repo}"
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                if action == "list_issues":
                    resp = await client.get(f"{url}/issues", headers=headers)
                    if resp.status_code == 200:
                        issues = resp.json()
                        lines = [f"{repo} deposundaki aktif Issue/PR listesi:"]
                        for i in issues:
                            is_pr = "pull_request" in i
                            type_lbl = "PR" if is_pr else "Issue"
                            lines.append(f"• #{i['number']} ({type_lbl}): {i['title']} - {i['state']}")
                        return ToolResult(ok=True, output="\n".join(lines), data={"issues": issues})
                    return ToolResult(ok=False, error=f"GitHub API Hatası ({resp.status_code}): {resp.text}")

                elif action == "create_issue":
                    if not title:
                        return ToolResult(ok=False, error="Issue basligi girilmelidir")
                    if not token:
                        return ToolResult(ok=False, error="GitHub Token olmadan issue olusturulamaz. GITHUB_TOKEN tanimlayin.")
                    payload = {"title": title, "body": body}
                    resp = await client.post(f"{url}/issues", json=payload, headers=headers)
                    if resp.status_code == 201:
                        data = resp.json()
                        return ToolResult(ok=True, output=f"Issue #{data['number']} olusturuldu: {data['html_url']}", data=data)
                    return ToolResult(ok=False, error=f"Issue olusturulamadi ({resp.status_code}): {resp.text}")

                elif action == "list_prs":
                    resp = await client.get(f"{url}/pulls", headers=headers)
                    if resp.status_code == 200:
                        prs = resp.json()
                        lines = [f"{repo} Pull Request listesi:"]
                        for p in prs:
                            lines.append(f"• #{p['number']}: {p['title']} ({p['head']['ref']} -> {p['base']['ref']}) - {p['state']}")
                        return ToolResult(ok=True, output="\n".join(lines), data={"prs": prs})
                    return ToolResult(ok=False, error=f"PR'lar listelenemedi ({resp.status_code}): {resp.text}")

                elif action == "create_pr":
                    if not title or not head:
                        return ToolResult(ok=False, error="PR basligi ve kaynak (head) branch gereklidir")
                    if not token:
                        return ToolResult(ok=False, error="GitHub Token olmadan PR olusturulamaz. GITHUB_TOKEN tanimlayin.")
                    payload = {"title": title, "body": body, "head": head, "base": base}
                    resp = await client.post(f"{url}/pulls", json=payload, headers=headers)
                    if resp.status_code == 201:
                        data = resp.json()
                        return ToolResult(ok=True, output=f"Pull Request #{data['number']} olusturuldu: {data['html_url']}", data=data)
                    return ToolResult(ok=False, error=f"PR olusturulamadi ({resp.status_code}): {resp.text}")

                elif action == "add_comment":
                    if not number:
                        return ToolResult(ok=False, error="Yorum eklenecek Issue/PR numarasi girilmelidir")
                    if not body:
                        return ToolResult(ok=False, error="Yorum icerigi bos olamaz")
                    if not token:
                        return ToolResult(ok=False, error="GitHub Token olmadan yorum eklenemez.")
                    resp = await client.post(f"{url}/issues/{number}/comments", json={"body": body}, headers=headers)
                    if resp.status_code == 201:
                        data = resp.json()
                        return ToolResult(ok=True, output=f"Yorum eklendi: {data['html_url']}", data=data)
                    return ToolResult(ok=False, error=f"Yorum eklenemedi ({resp.status_code}): {resp.text}")

                else:
                    return ToolResult(ok=False, error=f"Bilinmeyen islem: {action}")
        except Exception as exc:
            logger.exception("github_api hatasi")
            return ToolResult(ok=False, error=f"GitHub API baglanti hatasi: {exc}")
