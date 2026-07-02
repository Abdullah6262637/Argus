"""Email tool'lari (Sprint 3.2).

SMTP gonderme + IMAP okuma. Standart kütüphane (smtplib, imaplib, email)
kullanir, ek paket gerektirmez.

Kimlik bilgileri:
  - Tool argumanlarinda dogrudan verilebilir
  - VEYA .env'den okunabilir (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
    IMAP_HOST, IMAP_PORT, IMAP_USER, IMAP_PASS)

Permission: 'web_search' (DIS dunyaya cikan iletisim icin makul bir bayrak).
Onaya tabi: send icin requires_confirmation=True (yanlislikla mail atmasin).
"""
from __future__ import annotations

import asyncio
import email
import imaplib
import logging
import os
import smtplib
from email.message import EmailMessage
from email.utils import parsedate_to_datetime
from typing import Any, Dict, List, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


def _env(key: str, default: Optional[str] = None) -> Optional[str]:
    val = os.environ.get(key)
    return val if val else default


# ============================================================
# SMTP send
# ============================================================

class EmailSendTool(BaseTool):
    name = "email_send"
    description = (
        "SMTP ile email gonder. Gizli/kritik bilgi paylasimi olabilir; "
        "kullanici onayi onerilir."
    )
    permission = "web_search"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "to": {"type": "string", "description": "Alici adresi (virgulle birden cok)"},
            "subject": {"type": "string", "description": "Konu"},
            "body": {"type": "string", "description": "Govde (text/plain veya HTML)"},
            "html": {"type": "boolean", "description": "Body HTML mi (varsayilan: False)"},
            "cc": {"type": "string", "description": "CC (opsiyonel)"},
            "bcc": {"type": "string", "description": "BCC (opsiyonel)"},
            "from_addr": {"type": "string", "description": "Gonderen (varsayilan: SMTP_USER)"},
            "smtp_host": {"type": "string", "description": "SMTP sunucu (env: SMTP_HOST)"},
            "smtp_port": {"type": "integer", "description": "SMTP port (varsayilan 587)"},
            "smtp_user": {"type": "string", "description": "SMTP kullanici (env: SMTP_USER)"},
            "smtp_pass": {"type": "string", "description": "SMTP parola (env: SMTP_PASS)"},
            "use_tls": {"type": "boolean", "description": "STARTTLS (varsayilan: True)"}},
        "required": ["to", "subject", "body"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        to_raw = str(args.get("to") or "").strip()
        if not to_raw:
            return ToolResult(ok=False, error="to zorunlu")
        to_list = [a.strip() for a in to_raw.split(",") if a.strip()]
        cc_list = [a.strip() for a in str(args.get("cc") or "").split(",") if a.strip()]
        bcc_list = [a.strip() for a in str(args.get("bcc") or "").split(",") if a.strip()]
        subject = str(args.get("subject") or "")
        body = str(args.get("body") or "")
        is_html = bool(args.get("html", False))

        host = str(args.get("smtp_host") or _env("SMTP_HOST") or "")
        if not host:
            return ToolResult(ok=False, error="smtp_host yok (.env SMTP_HOST de ayarli degil)")
        port = int(args.get("smtp_port") or _env("SMTP_PORT", "587"))
        user = str(args.get("smtp_user") or _env("SMTP_USER") or "")
        password = str(args.get("smtp_pass") or _env("SMTP_PASS") or "")
        from_addr = str(args.get("from_addr") or user)
        use_tls = bool(args.get("use_tls", True))

        if not from_addr:
            return ToolResult(ok=False, error="from_addr veya smtp_user gerekli")

        msg = EmailMessage()
        msg["From"] = from_addr
        msg["To"] = ", ".join(to_list)
        if cc_list:
            msg["Cc"] = ", ".join(cc_list)
        msg["Subject"] = subject
        if is_html:
            msg.set_content("Bu email HTML icerigine sahip; goruntulemek icin HTML destekli istemci kullanin.")
            msg.add_alternative(body, subtype="html")
        else:
            msg.set_content(body)

        rcpts = list(set(to_list + cc_list + bcc_list))

        loop = asyncio.get_event_loop()

        def _send_blocking() -> None:
            with smtplib.SMTP(host, port, timeout=30) as smtp:
                if use_tls:
                    smtp.starttls()
                if user and password:
                    smtp.login(user, password)
                smtp.send_message(msg, from_addr=from_addr, to_addrs=rcpts)

        try:
            await loop.run_in_executor(None, _send_blocking)
        except Exception as exc:
            logger.exception("email_send hata")
            return ToolResult(ok=False, error=f"SMTP hata: {exc}")

        return ToolResult(
            ok=True,
            output=f"Email gonderildi: {len(rcpts)} alici",
            data={"to": to_list, "cc": cc_list, "bcc": bcc_list, "subject": subject},
        )


# ============================================================
# IMAP read
# ============================================================

class EmailReadInboxTool(BaseTool):
    name = "email_read_inbox"
    description = (
        "IMAP ile inbox'tan son N email'i oku. Sadece basliklari ve metin "
        "ozetlerini doner; ekleri indirmez."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "limit": {"type": "integer", "description": "Maks email sayisi (varsayilan 10)"},
            "folder": {"type": "string", "description": "Klasor (varsayilan: INBOX)"},
            "search": {"type": "string", "description": "IMAP search query (orn: 'UNSEEN' veya 'FROM example@x.com')"},
            "imap_host": {"type": "string", "description": "IMAP sunucu (env: IMAP_HOST)"},
            "imap_port": {"type": "integer", "description": "IMAP port (varsayilan 993)"},
            "imap_user": {"type": "string", "description": "IMAP kullanici (env: IMAP_USER)"},
            "imap_pass": {"type": "string", "description": "IMAP parola (env: IMAP_PASS)"},
            "ssl": {"type": "boolean", "description": "SSL kullan (varsayilan: True)"}},
        "required": []}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        host = str(args.get("imap_host") or _env("IMAP_HOST") or "")
        if not host:
            return ToolResult(ok=False, error="imap_host yok (.env IMAP_HOST de ayarli degil)")
        port = int(args.get("imap_port") or _env("IMAP_PORT", "993"))
        user = str(args.get("imap_user") or _env("IMAP_USER") or "")
        password = str(args.get("imap_pass") or _env("IMAP_PASS") or "")
        if not user or not password:
            return ToolResult(ok=False, error="imap_user / imap_pass gerekli")

        folder = str(args.get("folder") or "INBOX")
        limit = int(args.get("limit", 10))
        search = str(args.get("search") or "ALL")
        use_ssl = bool(args.get("ssl", True))

        loop = asyncio.get_event_loop()

        def _fetch_blocking() -> List[Dict[str, Any]]:
            messages: List[Dict[str, Any]] = []
            cls = imaplib.IMAP4_SSL if use_ssl else imaplib.IMAP4
            with cls(host, port) as M:  # type: ignore[arg-type]
                M.login(user, password)
                M.select(folder, readonly=True)
                rc, data = M.search(None, search)
                if rc != "OK":
                    return []
                ids = (data[0] or b"").split()
                # Sondan ilk limit kadarini al
                latest = ids[-limit:]
                for mid in reversed(latest):
                    rc, msg_data = M.fetch(mid, "(RFC822)")
                    if rc != "OK" or not msg_data:
                        continue
                    raw = msg_data[0][1] if isinstance(msg_data[0], tuple) else b""
                    try:
                        eml = email.message_from_bytes(raw)
                    except Exception:
                        continue
                    subj = str(eml.get("Subject") or "")
                    sender = str(eml.get("From") or "")
                    date_h = str(eml.get("Date") or "")
                    try:
                        dt = parsedate_to_datetime(date_h).isoformat() if date_h else ""
                    except Exception:
                        dt = date_h
                    # Body
                    body_text = ""
                    if eml.is_multipart():
                        for part in eml.walk():
                            ct = part.get_content_type()
                            disp = str(part.get("Content-Disposition") or "")
                            if ct == "text/plain" and "attachment" not in disp:
                                try:
                                    body_text = part.get_payload(decode=True).decode(  # type: ignore[union-attr]
                                        part.get_content_charset() or "utf-8",
                                        errors="replace",
                                    )
                                except Exception:
                                    pass
                                break
                    else:
                        try:
                            body_text = eml.get_payload(decode=True).decode(  # type: ignore[union-attr]
                                eml.get_content_charset() or "utf-8",
                                errors="replace",
                            )
                        except Exception:
                            body_text = ""
                    # Kirpma
                    if len(body_text) > 1000:
                        body_text = body_text[:1000] + "..."
                    messages.append({
                        "id": mid.decode() if isinstance(mid, bytes) else str(mid),
                        "from": sender,
                        "subject": subj,
                        "date": dt,
                        "body_preview": body_text.strip()})
            return messages

        try:
            messages = await loop.run_in_executor(None, _fetch_blocking)
        except Exception as exc:
            logger.exception("email_read hata")
            return ToolResult(ok=False, error=f"IMAP hata: {exc}")

        if not messages:
            return ToolResult(ok=True, output="(email yok)", data={"messages": []})

        summary_lines = [
            f"{m['date'][:16]} | {m['from'][:40]} | {m['subject'][:60]}"
            for m in messages
        ]
        return ToolResult(
            ok=True,
            output="\n".join(summary_lines),
            data={"messages": messages, "count": len(messages)},
        )