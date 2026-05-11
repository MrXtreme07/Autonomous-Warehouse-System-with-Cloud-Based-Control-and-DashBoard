from __future__ import annotations

from app.models.schemas import MissionPipelineStage


SYSTEM_EVENT_STAGE_MAP = {
    "RFID_AUTH": MissionPipelineStage.RFID_AUTH,
    "AUTH_SUCCESS": MissionPipelineStage.RFID_AUTH,
    "ORDER_CREATED": MissionPipelineStage.ORDER_CREATED,
    "ROBOT_DEPLOYED": MissionPipelineStage.ROBOT_DEPLOYED,
    "ROBOT_DEPLOY": MissionPipelineStage.ROBOT_DEPLOYED,
    "PACKAGE_CONFIRMED": MissionPipelineStage.PACKAGE_CONFIRMED,
    "PACKAGE_COLLECTED": MissionPipelineStage.PACKAGE_CONFIRMED,
    "DELIVERY_COMPLETE": MissionPipelineStage.DELIVERY_COMPLETE,
    "MISSION_COMPLETE": MissionPipelineStage.DELIVERY_COMPLETE,
}


def stage_for_system_event(event_type: str) -> MissionPipelineStage | None:
    return SYSTEM_EVENT_STAGE_MAP.get(event_type.upper())
