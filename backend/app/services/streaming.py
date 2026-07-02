"""SSE (Server-Sent Events) yardimcilari."""
from __future__ import annotations

import json
from typing import Any, Dict


def sse_format(event_type: str, data: Dict[str, Any]) -> str:
    """Bir SSE event'ini wire-format'a cevir.
    
    Format:
        event: <type>
        data: <json>
        \n
    """
    payload = json.dumps(data, ensure_ascii=False, default=str)
    return f"event: {event_type}\ndata: {payload}\n\n"


def sse_comment(text: str) -> str:
    """SSE keep-alive yorumu."""
    return f": {text}\n\n"