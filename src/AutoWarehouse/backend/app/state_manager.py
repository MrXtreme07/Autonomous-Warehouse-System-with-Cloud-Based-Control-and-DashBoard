from __future__ import annotations

from threading import RLock

from app.models.schemas import StateSnapshot, SystemState


class StateManager:
    """Centralized state transitions for the warehouse system."""

    def __init__(self, initial_state: SystemState = SystemState.LOCKED) -> None:
        self._state = initial_state
        self._lock = RLock()

    @property
    def state(self) -> SystemState:
        with self._lock:
            return self._state

    def set_state(self, state: SystemState) -> bool:
        with self._lock:
            if self._state == state:
                return False
            self._state = state
            return True

    def snapshot(self) -> StateSnapshot:
        return StateSnapshot(state=self.state)
