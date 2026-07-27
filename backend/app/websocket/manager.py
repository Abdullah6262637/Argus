"""WebSocket baglanti yoneticisi - canli mesaj / log yayini."""
from __future__ import annotations

import asyncio
import logging
from typing import Any, Dict, List, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


import time
from collections import deque

class ConnectionManager:
    """Aktif WebSocket baglantilari yonetir ve broadcast saglar. (Gelismis Heartbeat ve Buffer Destekli)"""

    def __init__(self) -> None:
        self._connections: Set[WebSocket] = set()
        self._lock = asyncio.Lock()
        self._message_buffer: deque[Dict[str, Any]] = deque(maxlen=100) # Son 100 mesaji kurtarma icin tut
        self._ping_tasks: Dict[WebSocket, asyncio.Task[Any]] = {}

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
            # İstemci bağlandığında eski mesajları anında iletebiliriz (Recovery)
            # Bu, istemci state'ini hızlıca toparlamasını sağlar.
            for msg in self._message_buffer:
                try:
                    await websocket.send_json(msg)
                except Exception:
                    pass
        logger.info("WS baglandi, toplam: %d", len(self._connections))

        # Ping-pong loop (Heartbeat) baslat
        task = asyncio.create_task(self._heartbeat_loop(websocket))
        self._ping_tasks[websocket] = task

    async def _heartbeat_loop(self, websocket: WebSocket) -> None:
        try:
            while True:
                await asyncio.sleep(30) # 30 saniyede bir ping at
                await websocket.send_json({"type": "ping", "timestamp": time.time()})
        except Exception:
            await self.disconnect(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
            if websocket in self._ping_tasks:
                self._ping_tasks[websocket].cancel()
                del self._ping_tasks[websocket]
        logger.info("WS koptu, toplam: %d", len(self._connections))

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Tum bagli istemcilere JSON mesaj yayinlar ve buffer'a ekler."""
        stale: List[WebSocket] = []
        async with self._lock:
            conns = list(self._connections)
            self._message_buffer.append(message)

        for ws in conns:
            try:
                await ws.send_json(message)
            except Exception as exc:  # pragma: no cover
                logger.warning("WS gonderim hatasi: %s", exc)
                stale.append(ws)

        if stale:
            for s in stale:
                await self.disconnect(s)

connection_manager = ConnectionManager()