from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class SystemState(str, Enum):
    LOCKED = "LOCKED"
    IDLE = "IDLE"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    ERROR = "ERROR"


class EventSeverity(str, Enum):
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"


class MissionPipelineStage(str, Enum):
    RFID_AUTH = "RFID_AUTH"
    ORDER_CREATED = "ORDER_CREATED"
    ROBOT_DEPLOYED = "ROBOT_DEPLOYED"
    PACKAGE_CONFIRMED = "PACKAGE_CONFIRMED"
    DELIVERY_COMPLETE = "DELIVERY_COMPLETE"


class WarehouseEvent(BaseModel):
    id: str = Field(default_factory=lambda: uuid4().hex)
    timestamp: str = Field(default_factory=lambda: datetime.now().strftime("%H:%M:%S"))
    source: str
    type: str
    severity: EventSeverity = EventSeverity.INFO
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class StateSnapshot(BaseModel):
    state: SystemState


class LoadCellData(BaseModel):
    weight: float = 0
    status: Literal["idle", "loaded", "overload"] = "idle"
    unit: str = "kg"


class UltrasonicData(BaseModel):
    distance: float = 150
    status: Literal["clear", "intrusion", "error"] = "clear"
    unit: str = "cm"


class DHT22Data(BaseModel):
    temperature: float = 22.5
    humidity: float = 45
    status: Literal["normal", "warning", "critical"] = "normal"


class RFIDData(BaseModel):
    lastTag: str = ""
    authenticated: bool = False
    timestamp: str = ""


class RobotData(BaseModel):
    battery: float = 85
    speed: float = 0
    position: dict[str, float] = Field(default_factory=lambda: {"x": 0.0, "y": 0.0})
    status: Literal["idle", "moving", "returning", "stopped", "error"] = "idle"
    online: bool = False
    lastHeartbeat: str | None = None


class TelemetrySnapshot(BaseModel):
    loadCell: LoadCellData = Field(default_factory=LoadCellData)
    ultrasonic: UltrasonicData = Field(default_factory=UltrasonicData)
    dht22: DHT22Data = Field(default_factory=DHT22Data)
    rfid: RFIDData = Field(default_factory=RFIDData)
    robot: RobotData = Field(default_factory=RobotData)
    pipelineStage: MissionPipelineStage = MissionPipelineStage.RFID_AUTH


class WebSocketMessage(BaseModel):
    type: str
    payload: dict[str, Any] | list[Any] | str | int | float | bool | None


class CommandResponse(BaseModel):
    accepted: bool
    command: str
    state: SystemState
