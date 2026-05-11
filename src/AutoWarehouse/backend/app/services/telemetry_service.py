from __future__ import annotations

from datetime import datetime
from threading import RLock
from typing import Any

from app.models.schemas import MissionPipelineStage, TelemetrySnapshot


class TelemetryService:
    """Maintains the latest sensor and robot telemetry snapshot."""

    def __init__(self) -> None:
        self._telemetry = TelemetrySnapshot()
        self._last_robot_heartbeat: datetime | None = None
        self._robot_offline_reported = False
        self._lock = RLock()

    def update_loadcell(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        weight = float(payload.get("weight", 0))
        status = "overload" if weight > 10000 else "loaded" if weight > 300 else "idle"
        with self._lock:
            self._telemetry.loadCell.weight = weight
            self._telemetry.loadCell.status = status
            return self.snapshot()

    def update_ultrasonic(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        distance = float(payload.get("distance", 0))
        status = "intrusion" if distance < 20 else "clear"
        with self._lock:
            self._telemetry.ultrasonic.distance = distance
            self._telemetry.ultrasonic.status = status
            return self.snapshot()

    def update_dht22(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        temperature = float(payload.get("temperature", payload.get("temp", 0)))
        humidity = float(payload.get("humidity", 0))
        status = "critical" if temperature >= 40 or humidity >= 85 else "warning" if temperature >= 35 or humidity >= 70 else "normal"
        with self._lock:
            self._telemetry.dht22.temperature = temperature
            self._telemetry.dht22.humidity = humidity
            self._telemetry.dht22.status = status
            return self.snapshot()

    def update_rfid(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        status = str(payload.get("status", "")).upper()
        tag = str(payload.get("tag", payload.get("user", "")))
        with self._lock:
            self._telemetry.rfid.lastTag = tag
            self._telemetry.rfid.authenticated = status == "AUTHORIZED"
            self._telemetry.rfid.timestamp = datetime.now().strftime("%H:%M:%S")
            if status == "AUTHORIZED":
                self._telemetry.pipelineStage = MissionPipelineStage.RFID_AUTH
            return self.snapshot()

    def update_robot_status(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        robot_state = str(payload.get("state", payload.get("status", "idle"))).lower()
        mapped = {
            "moving": "moving",
            "active": "moving",
            "returning": "returning",
            "return": "returning",
            "stopped": "stopped",
            "paused": "stopped",
            "error": "error",
            "idle": "idle",
        }.get(robot_state, "idle")
        with self._lock:
            self._telemetry.robot.status = mapped
            self._mark_robot_online_locked()
            return self.snapshot()

    def update_robot_speed(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        speed = float(payload.get("speed", payload.get("value", 0)))
        with self._lock:
            self._telemetry.robot.speed = speed
            self._mark_robot_online_locked()
            return self.snapshot()

    def update_robot_telemetry(self, payload: dict[str, Any]) -> TelemetrySnapshot:
        with self._lock:
            if "battery" in payload:
                self._telemetry.robot.battery = float(payload["battery"])
            if "speed" in payload:
                self._telemetry.robot.speed = float(payload["speed"])
            if "position" in payload and isinstance(payload["position"], dict):
                self._telemetry.robot.position = {
                    "x": float(payload["position"].get("x", 0)),
                    "y": float(payload["position"].get("y", 0)),
                }
            self._mark_robot_online_locked()
            return self.snapshot()

    def mark_robot_offline_if_stale(self, timeout_seconds: float) -> bool:
        with self._lock:
            if self._last_robot_heartbeat is None:
                return False
            age = (datetime.now() - self._last_robot_heartbeat).total_seconds()
            if age <= timeout_seconds or self._robot_offline_reported:
                return False
            self._telemetry.robot.online = False
            self._telemetry.robot.status = "error"
            self._robot_offline_reported = True
            return True

    def set_pipeline_stage(self, stage: MissionPipelineStage) -> TelemetrySnapshot:
        with self._lock:
            self._telemetry.pipelineStage = stage
            return self.snapshot()

    def reset_pipeline(self) -> TelemetrySnapshot:
        return self.set_pipeline_stage(MissionPipelineStage.RFID_AUTH)

    def snapshot(self) -> TelemetrySnapshot:
        with self._lock:
            return self._telemetry.model_copy(deep=True)

    def _mark_robot_online_locked(self) -> None:
        now = datetime.now()
        self._last_robot_heartbeat = now
        self._telemetry.robot.online = True
        self._telemetry.robot.lastHeartbeat = now.isoformat(timespec="seconds")
        self._robot_offline_reported = False
