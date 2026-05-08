from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

import paho.mqtt.client as mqtt

from app.event_manager import EventManager
from app.models.schemas import EventSeverity, SystemState, WarehouseEvent
from app.services.telemetry_service import TelemetryService
from app.state_manager import StateManager
from app.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)

SUBSCRIBE_TOPICS = (
    "sensor/loadcell",
    "sensor/ultrasonic",
    "sensor/dht22",
    "rfid/access",
    "robot/status",
    "robot/state",
    "robot/speed",
    "system/event",
)


class MqttBridge:
    """MQTT bridge between hardware topics and backend orchestration state."""

    def __init__(
        self,
        *,
        state_manager: StateManager,
        event_manager: EventManager,
        telemetry_service: TelemetryService,
        websocket_manager: WebSocketManager,
        loop: asyncio.AbstractEventLoop,
        host: str | None = None,
        port: int | None = None,
    ) -> None:
        self.state_manager = state_manager
        self.event_manager = event_manager
        self.telemetry_service = telemetry_service
        self.websocket_manager = websocket_manager
        self.loop = loop
        self.host = host or os.getenv("MQTT_HOST", "localhost")
        self.port = port or int(os.getenv("MQTT_PORT", "1883"))
        self.client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        self.client.on_connect = self._on_connect
        self.client.on_message = self._on_message
        self.client.on_disconnect = self._on_disconnect

    def start(self) -> None:
        logger.info("Connecting to MQTT broker at %s:%s", self.host, self.port)
        self.client.connect_async(self.host, self.port, keepalive=30)
        self.client.loop_start()

    def stop(self) -> None:
        logger.info("Stopping MQTT bridge")
        self.client.loop_stop()
        self.client.disconnect()

    def publish(self, topic: str, payload: str) -> None:
        result = self.client.publish(topic, payload)
        if result.rc != mqtt.MQTT_ERR_SUCCESS:
            logger.warning("MQTT publish queued/failed topic=%s rc=%s", topic, result.rc)

    def publish_state(self) -> None:
        self.publish("system/state", json.dumps({"state": self.state_manager.state}))

    def _on_connect(self, client: mqtt.Client, userdata: Any, flags: Any, reason_code: Any, properties: Any) -> None:
        if not self._reason_code_ok(reason_code):
            logger.error("MQTT connection failed: %s", reason_code)
            return
        logger.info("MQTT connected")
        for topic in SUBSCRIBE_TOPICS:
            client.subscribe(topic)
            logger.info("Subscribed to %s", topic)

    def _on_disconnect(self, client: mqtt.Client, userdata: Any, disconnect_flags: Any, reason_code: Any, properties: Any) -> None:
        logger.warning("MQTT disconnected: %s", reason_code)

    @staticmethod
    def _reason_code_ok(reason_code: Any) -> bool:
        if hasattr(reason_code, "is_failure"):
            return not reason_code.is_failure
        try:
            return int(reason_code) == 0
        except (TypeError, ValueError):
            return str(reason_code).lower() in {"0", "success", "normal disconnection"}

    def _on_message(self, client: mqtt.Client, userdata: Any, message: mqtt.MQTTMessage) -> None:
        topic = message.topic
        try:
            payload = json.loads(message.payload.decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("payload must be a JSON object")
        except Exception as exc:
            logger.warning("Malformed MQTT payload on %s: %s", topic, exc)
            event = self.event_manager.add(
                source="mqtt",
                event_type="MALFORMED_PAYLOAD",
                severity=EventSeverity.WARNING,
                message=f"Malformed payload received on {topic}",
                data={"topic": topic},
            )
            self._broadcast_event(event)
            return

        try:
            self._process_message(topic, payload)
        except Exception:
            logger.exception("Failed processing MQTT message on %s", topic)
            event = self.event_manager.add(
                source="mqtt",
                event_type="PROCESSING_ERROR",
                severity=EventSeverity.ERROR,
                message=f"Processing error for topic {topic}",
                data={"topic": topic},
            )
            self._broadcast_event(event)

    def _process_message(self, topic: str, payload: dict[str, Any]) -> None:
        state_changed = False
        event: WarehouseEvent | None = None
        telemetry_changed = False

        if topic == "rfid/access":
            telemetry_changed = True
            self.telemetry_service.update_rfid(payload)
            status = str(payload.get("status", "")).upper()
            user = str(payload.get("user", payload.get("tag", "unknown")))
            if status == "AUTHORIZED":
                if self.state_manager.state == SystemState.LOCKED:
                    state_changed = self.state_manager.set_state(SystemState.IDLE)
                event = self.event_manager.add(
                    source="rfid",
                    event_type="AUTH_SUCCESS",
                    severity=EventSeverity.SUCCESS,
                    message=f"RFID authorized: {user}",
                    data=payload,
                )
            else:
                event = self.event_manager.add(
                    source="rfid",
                    event_type="AUTH_FAILURE",
                    severity=EventSeverity.WARNING,
                    message=f"RFID access denied: {user}",
                    data=payload,
                )

        elif topic == "sensor/loadcell":
            telemetry_changed = True
            self.telemetry_service.update_loadcell(payload)
            weight = float(payload.get("weight", 0))
            if weight > 300:
                event = self.event_manager.add(
                    source="loadcell",
                    event_type="PACKAGE_CONFIRMED",
                    severity=EventSeverity.SUCCESS,
                    message="Package confirmed by load cell",
                    data=payload,
                )

        elif topic == "sensor/ultrasonic":
            telemetry_changed = True
            self.telemetry_service.update_ultrasonic(payload)
            distance = float(payload.get("distance", 0))
            if distance < 20:
                state_changed = self.state_manager.set_state(SystemState.PAUSED)
                event = self.event_manager.add(
                    source="ultrasonic",
                    event_type="PROXIMITY_ALERT",
                    severity=EventSeverity.WARNING,
                    message="Proximity alert: obstacle inside safety threshold",
                    data=payload,
                )

        elif topic == "sensor/dht22":
            telemetry_changed = True
            snapshot = self.telemetry_service.update_dht22(payload)
            if snapshot.dht22.status != "normal":
                event = self.event_manager.add(
                    source="dht22",
                    event_type="ENVIRONMENT_WARNING",
                    severity=EventSeverity.WARNING,
                    message="DHT22 environmental reading outside normal range",
                    data=payload,
                )

        elif topic == "robot/status":
            telemetry_changed = True
            self.telemetry_service.update_robot_telemetry(payload)

        elif topic == "robot/state":
            telemetry_changed = True
            self.telemetry_service.update_robot_status(payload)

        elif topic == "robot/speed":
            telemetry_changed = True
            self.telemetry_service.update_robot_speed(payload)

        elif topic == "system/event":
            event = self.event_manager.add(
                source=str(payload.get("source", "system")),
                event_type=str(payload.get("type", "SYSTEM_EVENT")),
                severity=EventSeverity(payload.get("severity", "info")),
                message=str(payload.get("message", "System event received")),
                data=payload,
            )

        if state_changed:
            self.publish_state()
            self._broadcast("state", self.state_manager.snapshot().model_dump(mode="json"))
        if telemetry_changed:
            self._broadcast("telemetry", self.telemetry_service.snapshot().model_dump(mode="json"))
        if event:
            self._broadcast_event(event)

    def _broadcast_event(self, event: WarehouseEvent) -> None:
        self._broadcast("event", event.model_dump(mode="json"))
        self._broadcast("events", [item.model_dump(mode="json") for item in self.event_manager.list()])

    def _broadcast(self, message_type: str, payload: Any) -> None:
        asyncio.run_coroutine_threadsafe(
            self.websocket_manager.broadcast(message_type, payload),
            self.loop,
        )
