"""Database tool'lari (Sprint 3.3).

SQLAlchemy ile generic SQL query/execute/schema introspect.
SQLite, PostgreSQL, MySQL gibi connection_string kabul edebilen butun dialektler
destekleniyor (driver'i kuruluysa).

Permission: 'system_admin' (DB'ye direkt SQL yazmak yuksek riskli).
DELETE / DROP / UPDATE icin requires_confirmation = True.
"""
from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Dict, List, Optional

from app.services.tools.base import BaseTool, ToolContext, ToolResult

logger = logging.getLogger(__name__)


_DESTRUCTIVE_RE = re.compile(
    r"^\s*(delete|drop|truncate|alter|update|insert|grant|revoke|create)\b",
    re.IGNORECASE,
)


def _is_destructive(sql: str) -> bool:
    return bool(_DESTRUCTIVE_RE.match(sql or ""))


def _safe_engine(connection_string: str):
    try:
        from sqlalchemy import create_engine
    except ImportError as exc:
        raise RuntimeError("SQLAlchemy kurulu degil") from exc
    return create_engine(connection_string, future=True)


class DBQueryTool(BaseTool):
    name = "db_query"
    description = (
        "Bir SQL SELECT sorgusu calistir, sonuc satirlarini liste olarak doner. "
        "Sadece okuma amaclidir; INSERT/UPDATE/DELETE icin db_execute kullanin."
    )
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "connection_string": {"type": "string", "description": "SQLAlchemy URL (orn: sqlite:///./db.sqlite)"},
            "sql": {"type": "string", "description": "Calistirilacak SELECT SQL"},
            "params": {"type": "object", "description": "Bind parametreleri (opsiyonel)"},
            "max_rows": {"type": "integer", "description": "Maks satir (varsayilan 200)"}},
        "required": ["connection_string", "sql"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        cs = str(args.get("connection_string") or "")
        sql = str(args.get("sql") or "").strip()
        params = args.get("params") or {}
        max_rows = int(args.get("max_rows", 200))
        if not cs or not sql:
            return ToolResult(ok=False, error="connection_string ve sql zorunlu")
        if _is_destructive(sql):
            return ToolResult(ok=False, error="db_query sadece SELECT icin; degistirici komutlar db_execute ile.")

        loop = asyncio.get_event_loop()

        def _run() -> Dict[str, Any]:
            from sqlalchemy import text
            engine = _safe_engine(cs)
            try:
                with engine.connect() as conn:
                    result = conn.execute(text(sql), params)
                    cols = list(result.keys())
                    rows = result.mappings().fetchmany(max_rows)
                    return {
                        "columns": cols,
                        "rows": [dict(r) for r in rows],
                        "row_count": len(rows)}
            finally:
                engine.dispose()

        try:
            data = await loop.run_in_executor(None, _run)
        except Exception as exc:
            logger.exception("db_query hata")
            return ToolResult(ok=False, error=f"SQL hata: {exc}")

        # Compact output
        cols = data["columns"]
        preview_rows = data["rows"][:20]
        lines = [" | ".join(str(c) for c in cols)]
        for r in preview_rows:
            lines.append(" | ".join(str(r.get(c, "")) for c in cols))
        out = "\n".join(lines)
        if data["row_count"] > 20:
            out += f"\n... ({data['row_count']} satir, ilk 20 gosterildi)"
        return ToolResult(ok=True, output=out, data=data)


class DBExecuteTool(BaseTool):
    name = "db_execute"
    description = (
        "INSERT/UPDATE/DELETE/CREATE/ALTER/DROP gibi degistirici SQL calistir. "
        "Geri alinmasi zor olabilir; onay alinacaktir."
    )
    permission = "system_admin"
    requires_confirmation = True
    parameters = {
        "type": "object",
        "properties": {
            "connection_string": {"type": "string"},
            "sql": {"type": "string"},
            "params": {"type": "object"}},
        "required": ["connection_string", "sql"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        cs = str(args.get("connection_string") or "")
        sql = str(args.get("sql") or "").strip()
        params = args.get("params") or {}
        if not cs or not sql:
            return ToolResult(ok=False, error="connection_string ve sql zorunlu")

        loop = asyncio.get_event_loop()

        def _run() -> Dict[str, Any]:
            from sqlalchemy import text
            engine = _safe_engine(cs)
            try:
                with engine.begin() as conn:
                    result = conn.execute(text(sql), params)
                    return {"rowcount": getattr(result, "rowcount", -1)}
            finally:
                engine.dispose()

        try:
            data = await loop.run_in_executor(None, _run)
        except Exception as exc:
            logger.exception("db_execute hata")
            return ToolResult(ok=False, error=f"SQL hata: {exc}")
        return ToolResult(ok=True, output=f"{data.get('rowcount', 0)} satir etkilendi.", data=data)


class DBSchemaTool(BaseTool):
    name = "db_schema"
    description = "Veritabanindaki tablo + sutun listesini doner."
    permission = "system_admin"
    parameters = {
        "type": "object",
        "properties": {
            "connection_string": {"type": "string"}},
        "required": ["connection_string"]}

    async def execute(self, args: Dict[str, Any], context: ToolContext) -> ToolResult:
        cs = str(args.get("connection_string") or "")
        if not cs:
            return ToolResult(ok=False, error="connection_string zorunlu")
        loop = asyncio.get_event_loop()

        def _run() -> Dict[str, Any]:
            from sqlalchemy import inspect
            engine = _safe_engine(cs)
            try:
                insp = inspect(engine)
                tables: Dict[str, List[Dict[str, Any]]] = {}
                for tname in insp.get_table_names():
                    cols = insp.get_columns(tname)
                    tables[tname] = [{"name": c.get("name"), "type": str(c.get("type")), "nullable": bool(c.get("nullable"))} for c in cols]
                return {"tables": tables, "count": len(tables)}
            finally:
                engine.dispose()

        try:
            data = await loop.run_in_executor(None, _run)
        except Exception as exc:
            logger.exception("db_schema hata")
            return ToolResult(ok=False, error=f"Schema hata: {exc}")

        lines = []
        for tname, cols in (data.get("tables") or {}).items():
            cols_str = ", ".join(f"{c['name']}:{c['type']}" for c in cols)
            lines.append(f"{tname}({cols_str})")
        return ToolResult(ok=True, output="\n".join(lines) or "(tablo yok)", data=data)