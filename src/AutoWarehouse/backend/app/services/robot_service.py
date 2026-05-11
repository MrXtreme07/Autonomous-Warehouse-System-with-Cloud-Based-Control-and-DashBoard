from __future__ import annotations

import json
import logging
from typing import Protocol

from app.event_manager import EventManager
from app.models.schemas import CommandResponse, EventSeverity, MissionPipelineStage, SystemState
from app.services.telemetry_service import TelemetryService
from app.state_manager import StateManager

logger = logging.getLogger(__name__)


class Publisher(Protocol):
    def publish(self, topic: str, payload: str) -> None:
        ...


class RobotService:
    """Publishes robot/system commands and records operator actions."""

    def __init__(
        self,
        publisher: Publisher,
        state_manager: StateManager,
        event_manager: EventManager,
        telemetry_service: TelemetryService,
    ) -> None:
        self.publisher = publisher
        self.state_manager = state_manager
        self.event_manager = event_manager
        self.telemetry_service = telemetry_service

    def send_command(self, command: str) -> CommandResponse:
        state_after_command = {
            "deploy": SystemState.ACTIVE,
            "pause": SystemState.PAUSED,
            "resume": SystemState.ACTIVE,
            "return": SystemState.IDLE,
        }.get(command)

        if state_after_command is not None:
            self.state_manager.set_state(state_after_command)

        if command == "deploy":
            self.telemetry_service.set_pipeline_stage(MissionPipelineStage.ROBOT_DEPLOYED)

        payload = json.dumps({"command": command})
        self.publisher.publish("robot/command", payload)
        self.publisher.publish("system/state", json.dumps({"state": self.state_manager.state}))
        self.event_manager.add(
            source="operator",
            event_type=f"ROBOT_{command.upper().replace('-', '_')}",
            severity=EventSeverity.INFO,
            message=f"Robot command published: {command}",
            data={"command": command},
        )
        logger.info("Published robot command: %s", command)
        return CommandResponse(accepted=True, command=command, state=self.state_manager.state)

    def emergency_stop(self) -> CommandResponse:
        self.state_manager.set_state(SystemState.ERROR)
        self.publisher.publish("robot/command", json.dumps({"command": "emergency-stop"}))
        self.publisher.publish("system/state", json.dumps({"state": SystemState.ERROR}))
        self.publisher.publish("system/event", json.dumps({"type": "EMERGENCY_STOP"}))
        self.event_manager.add(
            source="operator",
            event_type="EMERGENCY_STOP",
            severity=EventSeverity.ERROR,
            message="Emergency stop activated by operator",
        )
        return CommandResponse(accepted=True, command="emergency-stop", state=SystemState.ERROR)
