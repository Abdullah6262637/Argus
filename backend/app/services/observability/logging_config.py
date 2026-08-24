"""Structured JSON logging + trace_id (FAZ 8.1)."""
from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any, Dict

from app.config import get_settings
from app.services.observability.trace import get_trace_id


class JsonFormatter(logging.Formatter):
    """Her log satirini JSON-line formatinda yazar."""

    DEFAULT_FIELDS = {
        "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
        "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
        "created", "msecs", "relativeCreated", "thread", "threadName",
        "processName", "process", "message", "asctime"}

    def format(self, record: logging.LogRecord) -> str:
        payload: Dict[str, Any] = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "line": record.lineno}
        tid = get_trace_id()
        if tid:
            payload["trace_id"] = tid

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        # Ekstra alanlar
        for k, v in record.__dict__.items():
            if k not in self.DEFAULT_FIELDS and not k.startswith("_"):
                if k in payload:
                    continue
                try:
                    json.dumps(v)
                    payload[k] = v
                except (TypeError, ValueError):
                    payload[k] = str(v)

        return json.dumps(payload, ensure_ascii=False, default=str)


def setup_logging() -> None:
    """Uygulama baslangicinda cagrilir."""
    settings = get_settings()
    fmt = (settings.log_format or "text").lower()

    root = logging.getLogger()
    # Mevcut handler'lari kaldir
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler(sys.stdout)
    if fmt == "json":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
            )
        )
    root.addHandler(handler)
    root.setLevel(logging.INFO)

    # Dosya handler (her gun ayri jsonl)
    try:
        from pathlib import Path
        logs_dir = settings.data_dir / "logs"
        logs_dir.mkdir(parents=True, exist_ok=True)
        file_path = logs_dir / f"app-{datetime.now(UTC).strftime('%Y-%m-%d')}.jsonl"
        fh = logging.FileHandler(str(file_path), encoding="utf-8")
        fh.setFormatter(JsonFormatter())
        fh.setLevel(logging.INFO)
        root.addHandler(fh)
    except Exception:
        pass  # log dosyasi olusturulamazsa stdout yeterli