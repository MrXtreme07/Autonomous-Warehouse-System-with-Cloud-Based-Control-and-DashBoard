from __future__ import annotations

from collections import deque
from threading import RLock
from typing import Iterable

from app.models.schemas import EventSeverity, WarehouseEvent


class EventManager:
    """In-memory bounded event timeline for the industrial dashboard."""

    def __init__(self, max_events: int = 100) -> None:
        self._events: deque[WarehouseEvent] = deque(maxlen=max_events)
        self._lock = RLock()

    def add(
        self,
        *,
        source: str,
        event_type: str,
        message: str,
        severity: EventSeverity = EventSeverity.INFO,
        data: dict | None = None,
    ) -> WarehouseEvent:
        event = WarehouseEvent(
            source=source,
            type=event_type,
            severity=severity,
            message=message,
            data=data or {},
        )
        with self._lock:
            self._events.append(event)
        return event

    def list(self) -> list[WarehouseEvent]:
        with self._lock:
            return list(self._events)

    def extend(self, events: Iterable[WarehouseEvent]) -> None:
        with self._lock:
            self._events.extend(events)
