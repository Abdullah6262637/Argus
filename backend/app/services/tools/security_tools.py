"""Sprint D.7: Guvenlik ve ag tool'lari.

- dns_lookup     : domain icin DNS A/AAAA/MX/TXT kayitlari (dnspython)
- whois_query    : whois bilgileri (python-whois opsiyonel)
- ssl_cert_check : SSL sertifikasi gecerlilik bilgisi (yerlesik ssl modulu)
- port_scan      : tek host icin acik port taramasi (HIGH RISK — HITL)
"""
from __future__ import annotations

import asyncio
import logging
import socket
import ssl
from datetime import UTC, datetime
from typing import Any, Dict, List

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


# ============================================================
# dns_lookup
# ============================================================


class DNSLookupTool(BaseTool):
    name = "dns_lookup"
    description = (
        "Bir hostname icin DNS kayitlarini sorgular (A, AAAA, MX, TXT, NS, CNAME). "
        "dnspython paketi yoksa basit socket.getaddrinfo fallback'i kullanir."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "host": {"type": "string"},
            "record_type": {
                "type": "string",
                "enum": ["A", "AAAA", "MX", "TXT", "NS", "CNAME", "ALL"],
                "default": "A"}},
        "required": ["host"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        host = (args.get("host") or "").strip()
        if not host:
            return ToolResult(ok=False, error="host bos olamaz")
        record_type = (args.get("record_type") or "A").upper()

        dns_module = None
        try:
            import dns.resolver as _dns_resolver  # type: ignore
            dns_module = _dns_resolver
        except ImportError:
            pass

        if dns_module is not None:
            types = ["A", "AAAA", "MX", "TXT", "NS", "CNAME"] if record_type == "ALL" else [record_type]
            results: Dict[str, List[str]] = {}
            try:
                resolver = dns_module.Resolver()
                for t in types:
                    try:
                        answers = await asyncio.get_event_loop().run_in_executor(
                            None, lambda tt=t: resolver.resolve(host, tt),
                        )
                        results[t] = [str(rdata) for rdata in answers]
                    except Exception:
                        results[t] = []
            except Exception as exc:
                return ToolResult(ok=False, error=f"DNS resolver hata: {exc}")

            lines = []
            for t, vals in results.items():
                if vals:
                    lines.append(f"{t}:")
                    for v in vals:
                        lines.append(f"  {v}")
            output = "\n".join(lines) if lines else "(kayit yok)"
            return ToolResult(ok=True, output=output, data={"host": host, "records": results})

        # Fallback: socket
        try:
            infos = await asyncio.get_event_loop().run_in_executor(
                None, lambda: socket.getaddrinfo(host, None),
            )
            ipv4: List[str] = sorted({str(i[4][0]) for i in infos if i[0] == socket.AF_INET})
            ipv6: List[str] = sorted({str(i[4][0]) for i in infos if i[0] == socket.AF_INET6})
        except Exception as exc:
            return ToolResult(ok=False, error=f"socket lookup hata: {exc}")

        output = f"A: {', '.join(ipv4) or '-'}\nAAAA: {', '.join(ipv6) or '-'}"
        return ToolResult(
            ok=True,
            output=output,
            data={"host": host, "A": ipv4, "AAAA": ipv6, "fallback": "socket"},
        )


# ============================================================
# whois_query
# ============================================================


class WhoisQueryTool(BaseTool):
    name = "whois_query"
    description = (
        "Bir domain icin WHOIS sorgusu yapar (sahip, kayit tarihi, son kullanma). "
        "python-whois paketi gerekli."
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {"domain": {"type": "string"}},
        "required": ["domain"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        try:
            import whois  # type: ignore
        except ImportError:
            return ToolResult(ok=False, error="python-whois paketi yuklu degil. pip install python-whois")

        domain = (args.get("domain") or "").strip()
        if not domain:
            return ToolResult(ok=False, error="domain bos olamaz")

        try:
            w = await asyncio.get_event_loop().run_in_executor(None, whois.whois, domain)
        except Exception as exc:
            return ToolResult(ok=False, error=f"whois hata: {exc}")

        # whois.whois farkli tipte deger dondurebilir; stringle temsil edelim
        def _stringify(v: Any) -> Any:
            if isinstance(v, list):
                return [str(x) for x in v]
            if isinstance(v, datetime):
                return v.isoformat()
            return str(v) if v is not None else None

        data = {
            "domain": domain,
            "registrar": _stringify(getattr(w, "registrar", None)),
            "creation_date": _stringify(getattr(w, "creation_date", None)),
            "expiration_date": _stringify(getattr(w, "expiration_date", None)),
            "name_servers": _stringify(getattr(w, "name_servers", None)),
            "status": _stringify(getattr(w, "status", None)),
            "country": _stringify(getattr(w, "country", None))}

        lines = [f"WHOIS: {domain}"]
        for k, v in data.items():
            if k == "domain":
                continue
            lines.append(f"  {k}: {v}")
        return ToolResult(ok=True, output="\n".join(lines), data=data)


# ============================================================
# ssl_cert_check
# ============================================================


class SSLCertCheckTool(BaseTool):
    name = "ssl_cert_check"
    description = (
        "Bir hostname'in SSL/TLS sertifikasini kontrol eder. CN, SAN, gecerlilik tarihleri "
        "ve gunler kalan bilgisini doner. (yerlesik ssl modulu)"
    )
    permission = "web_search"
    parameters = {
        "type": "object",
        "properties": {
            "hostname": {"type": "string"},
            "port": {"type": "integer", "default": 443}},
        "required": ["hostname"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        host = (args.get("hostname") or "").strip()
        if not host:
            return ToolResult(ok=False, error="hostname bos olamaz")
        port = int(args.get("port") or 443)

        def _check() -> Dict[str, Any]:
            ctx = ssl.create_default_context()
            with socket.create_connection((host, port), timeout=10.0) as sock:
                with ctx.wrap_socket(sock, server_hostname=host) as ssock:
                    cert = ssock.getpeercert()
            return cert  # type: ignore[return-value]

        try:
            cert = await asyncio.get_event_loop().run_in_executor(None, _check)
        except Exception as exc:
            return ToolResult(ok=False, error=f"SSL kontrol hata: {exc}")

        # cert format: {'subject': ((('commonName', 'example.com'),),), 'issuer': ..., 'notBefore':..., 'notAfter':...}
        def _flatten(t):
            out = {}
            for tup in t:
                for kv in tup:
                    if len(kv) == 2:
                        out[kv[0]] = kv[1]
            return out

        subject = _flatten(cert.get("subject", []))
        issuer = _flatten(cert.get("issuer", []))
        not_before = cert.get("notBefore", "")
        not_after = cert.get("notAfter", "")

        # Gun farki
        days_left = None
        try:
            exp = datetime.strptime(not_after, "%b %d %H:%M:%S %Y %Z")
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=UTC)
            days_left = (exp - datetime.now(UTC)).days
        except Exception:
            pass

        sans: List[str] = []
        for ext in cert.get("subjectAltName", []) or []:
            if isinstance(ext, tuple) and len(ext) == 2:
                sans.append(f"{ext[0]}:{ext[1]}")

        output = (
            f"Host: {host}:{port}\n"
            f"CN: {subject.get('commonName')}\n"
            f"Issuer: {issuer.get('commonName')} / {issuer.get('organizationName')}\n"
            f"Valid: {not_before} -> {not_after}\n"
            f"Gun kalan: {days_left}\n"
            f"SAN: {', '.join(sans[:8]) or '-'}"
        )
        return ToolResult(
            ok=True,
            output=output,
            data={
                "host": host,
                "port": port,
                "subject": subject,
                "issuer": issuer,
                "not_before": not_before,
                "not_after": not_after,
                "days_left": days_left,
                "sans": sans},
        )


# ============================================================
# port_scan (HIGH RISK)
# ============================================================


class PortScanTool(BaseTool):
    name = "port_scan"
    description = (
        "[YUKSEK RISK] Bir host'ta TCP port araligini tarar. Sadece kendi sunucularinda "
        "kullan; baskalarinda port taramak yasal olmayabilir."
    )
    permission = "web_search"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "host": {"type": "string"},
            "ports": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "Tek tek portlar (ornek [80, 443, 22]). Maksimum 100"},
            "port_range": {
                "type": "string",
                "description": "(opsiyonel) 'start-end' formatinda araligi (ornek '1-1024')"},
            "timeout_sec": {"type": "number", "default": 1.0}},
        "required": ["host"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        host = (args.get("host") or "").strip()
        if not host:
            return ToolResult(ok=False, error="host bos olamaz")
        timeout = float(args.get("timeout_sec") or 1.0)

        ports: List[int] = []
        if args.get("ports"):
            ports = [int(p) for p in args["ports"]]
        elif args.get("port_range"):
            try:
                a, b = str(args["port_range"]).split("-", 1)
                start, end = int(a.strip()), int(b.strip())
                if end - start > 200:
                    return ToolResult(ok=False, error="Port araligi en fazla 200 olabilir (overload icin)")
                ports = list(range(start, end + 1))
            except Exception as exc:
                return ToolResult(ok=False, error=f"Gecersiz port_range: {exc}")
        else:
            ports = [22, 80, 443, 3306, 5432, 6379, 8080, 27017]

        if len(ports) > 200:
            ports = ports[:200]

        async def _check_port(p: int) -> tuple[int, bool]:
            try:
                fut = asyncio.open_connection(host, p)
                reader, writer = await asyncio.wait_for(fut, timeout=timeout)
                writer.close()
                try:
                    await writer.wait_closed()
                except Exception:
                    pass
                return p, True
            except Exception:
                return p, False

        results = await asyncio.gather(*[_check_port(p) for p in ports])
        open_ports = [p for p, ok in results if ok]
        closed_count = len(ports) - len(open_ports)

        output = (
            f"Host: {host}\n"
            f"Taranan: {len(ports)}\n"
            f"Acik portlar: {', '.join(map(str, open_ports)) or '(yok)'}\n"
            f"Kapali/filtrelenmis: {closed_count}"
        )
        return ToolResult(
            ok=True,
            output=output,
            data={
                "host": host,
                "open_ports": open_ports,
                "scanned": len(ports),
                "closed_count": closed_count},
        )