from __future__ import annotations

import asyncio
import logging
from typing import Any

from fastapi import WebSocket

from app.models.schemas import WebSocketMessage

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Tracks dashboard WebSocket clients and broadcasts JSON updates."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self._lock:
            self._connections.add(websocket)
        logger.info("WebSocket client connected; total=%s", len(self._connections))

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections.discard(websocket)
        logger.info("WebSocket client disconnected; total=%s", len(self._connections))

    async def broadcast(self, message_type: str, payload: Any) -> None:
        message = WebSocketMessage(type=message_type, payload=payload)
        await self.broadcast_model(message)

    async def broadcast_model(self, message: WebSocketMessage) -> None:
        async with self._lock:
            connections = list(self._connections)

        if not connections:
            return

        stale: list[WebSocket] = []
        encoded = message.model_dump(mode="json")
        for websocket in connections:
            try:
                await websocket.send_json(encoded)
            except Exception:
                logger.exception("Dropping failed WebSocket connection")
                stale.append(websocket)

        if stale:
            async with self._lock:
                for websocket in stale:
                    self._connections.discard(websocket)
