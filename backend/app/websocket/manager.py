"""WebSocket baglanti yoneticisi - canli mesaj / log yayini."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Aktif WebSocket baglantilari yonetir ve broadcast saglar."""

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info("WS baglandi, toplam: %d", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info("WS koptu, toplam: %d", len(self._connections))

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Tum bagli istemcilere JSON mesaj yayinlar."""
        stale: List[WebSocket] = []
        async with self._lock:
            conns = list(self._connections)

        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception as exc:  # pragma: no cover
                logger.warning("WS gonderim hatasi: %s", exc)
                stale.append(ws)

        if stale:
            async with self._lock:
                for s in stale:
                    self._connections.discard(s)


connection_manager = ConnectionManager()