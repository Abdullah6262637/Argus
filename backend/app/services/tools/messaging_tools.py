"""Messaging tools (Sprint 3.6): Slack / Discord / Telegram webhook + bot.

Webhook tabanli yontemler ucretsiz ve ek paket gerektirmez (sadece httpx).
Bot tabanli olanlar (Telegram bot API) basit HTTP istekleri ile calisir.
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


async def _post_json(url: str, payload: Dict[str, Any], timeout: float = 15.0) -> tuple[bool, str, Dict[str, Any]]:
    try:
        import httpx
    except ImportError:
        return False, "httpx kurulu degil", {}
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            r = await client.post(url, json=payload)
            ok = r.status_code < 400
            try:
                data = r.json()
            except Exception:
                data = {"text": r.text[:500]}
            return ok, f"HTTP {r.status_code}", data
    except Exception as exc:
        return False, f"HTTP hata: {exc}", {}


# ============================================================
# Slack
# ============================================================

class SlackSendTool(BaseTool):
    name = "slack_send"
    description = (
        "Slack incoming webhook URL'sine mesaj gonder. "
        "Webhook URL .env'de SLACK_WEBHOOK_URL olarak da tanimli olabilir."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Gonderilecek mesaj"},
            "webhook_url": {"type": "string", "description": "Slack webhook URL (env: SLACK_WEBHOOK_URL)"},
            "username": {"type": "string", "description": "Bot kullanici adi (opsiyonel)"},
            "icon_emoji": {"type": "string", "description": "Emoji icon (orn: :robot_face:)"}},
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        text = str(args.get("text") or "").strip()
        if not text:
            return ToolResult(ok=False, error="text zorunlu")
        url = str(args.get("webhook_url") or os.environ.get("SLACK_WEBHOOK_URL") or "")
        if not url:
            return ToolResult(ok=False, error="webhook_url yok (.env SLACK_WEBHOOK_URL ayarli degil)")
        payload: Dict[str, Any] = {"text": text}
        if args.get("username"):
            payload["username"] = str(args.get("username"))
        if args.get("icon_emoji"):
            payload["icon_emoji"] = str(args.get("icon_emoji"))
        ok, status, data = await _post_json(url, payload)
        return ToolResult(
            ok=ok,
            output=f"Slack: {status}" if ok else "",
            error=None if ok else f"Slack: {status}",
            data=data,
        )


# ============================================================
# Discord
# ============================================================

class DiscordSendTool(BaseTool):
    name = "discord_send"
    description = (
        "Discord webhook URL'sine mesaj gonder. "
        ".env'de DISCORD_WEBHOOK_URL olarak da tanimli olabilir."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "content": {"type": "string", "description": "Mesaj icerigi (max 2000 karakter)"},
            "webhook_url": {"type": "string", "description": "Discord webhook URL (env: DISCORD_WEBHOOK_URL)"},
            "username": {"type": "string", "description": "Bot kullanici adi (opsiyonel)"}},
        "required": ["content"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        content = str(args.get("content") or "").strip()
        if not content:
            return ToolResult(ok=False, error="content zorunlu")
        if len(content) > 2000:
            content = content[:1997] + "..."
        url = str(args.get("webhook_url") or os.environ.get("DISCORD_WEBHOOK_URL") or "")
        if not url:
            return ToolResult(ok=False, error="webhook_url yok (.env DISCORD_WEBHOOK_URL ayarli degil)")
        payload: Dict[str, Any] = {"content": content}
        if args.get("username"):
            payload["username"] = str(args.get("username"))
        ok, status, data = await _post_json(url, payload)
        return ToolResult(
            ok=ok,
            output=f"Discord: {status}" if ok else "",
            error=None if ok else f"Discord: {status}",
            data=data,
        )


# ============================================================
# Telegram
# ============================================================

class TelegramSendTool(BaseTool):
    name = "telegram_send"
    description = (
        "Telegram bot API ile mesaj gonder. Bot token ve chat_id gerekir. "
        ".env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "text": {"type": "string", "description": "Mesaj"},
            "chat_id": {"type": "string", "description": "Hedef chat id (env: TELEGRAM_CHAT_ID)"},
            "bot_token": {"type": "string", "description": "Bot token (env: TELEGRAM_BOT_TOKEN)"},
            "parse_mode": {"type": "string", "description": "MarkdownV2 / HTML / (bos)"}},
        "required": ["text"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        text = str(args.get("text") or "").strip()
        if not text:
            return ToolResult(ok=False, error="text zorunlu")
        token = str(args.get("bot_token") or os.environ.get("TELEGRAM_BOT_TOKEN") or "")
        chat_id = str(args.get("chat_id") or os.environ.get("TELEGRAM_CHAT_ID") or "")
        if not token or not chat_id:
            return ToolResult(ok=False, error="bot_token ve chat_id gerekli")
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload: Dict[str, Any] = {"chat_id": chat_id, "text": text}
        parse_mode = args.get("parse_mode")
        if parse_mode:
            payload["parse_mode"] = str(parse_mode)
        ok, status, data = await _post_json(url, payload)
        return ToolResult(
            ok=ok,
            output=f"Telegram: {status}" if ok else "",
            error=None if ok else f"Telegram: {status} {data}",
            data=data,
        )