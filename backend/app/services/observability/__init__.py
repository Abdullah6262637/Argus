"""Observability: structured JSON logs + trace_id."""
from app.services.observability.trace import TRACE_ID_VAR, get_trace_id, new_trace_id
from app.services.observability.logging_config import setup_logging

__all__ = ["TRACE_ID_VAR", "get_trace_id", "new_trace_id", "setup_logging"]