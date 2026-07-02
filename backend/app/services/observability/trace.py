"""Trace ID context: her HTTP/WS istegi icin uuid."""
from __future__ import annotations

import uuid
from contextvars import ContextVar
from typing import Optional

TRACE_ID_VAR: ContextVar[Optional[str]] = ContextVar("trace_id", default=None)


def new_trace_id() -> str:
    tid = uuid.uuid4().hex[:16]
    TRACE_ID_VAR.set(tid)
    return tid


def get_trace_id() -> Optional[str]:
    return TRACE_ID_VAR.get()