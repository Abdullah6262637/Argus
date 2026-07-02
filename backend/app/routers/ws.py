"""/ws WebSocket endpoint'i."""
from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket import connection_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Istemcilere canli mesaj / event push'u icin WS endpoint."""
    await connection_manager.connect(websocket)
    try:
        await websocket.send_json({"type": "hello", "message": "bagli"})
        while True:
            # Istemciden gelen ping veya komutlari dinle
            data = await websocket.receive_text()
            # Basit echo/heartbeat davranis
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            else:
                await websocket.send_json({"type": "ack", "echo": data})
    except WebSocketDisconnect:
        await connection_manager.disconnect(websocket)
    except Exception as exc:  # pragma: no cover
        logger.warning("WS hatasi: %s", exc)
        await connection_manager.disconnect(websocket)