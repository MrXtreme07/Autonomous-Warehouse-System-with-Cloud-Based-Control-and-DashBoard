from __future__ import annotations

import json

from fastapi import APIRouter, Request

from app.models.schemas import CommandResponse, EventSeverity, SystemState

router = APIRouter()


@router.get("/state")
async def get_state(request: Request) -> dict:
    return request.app.state.state_manager.snapshot().model_dump(mode="json")


@router.get("/events")
async def get_events(request: Request) -> list[dict]:
    return [event.model_dump(mode="json") for event in request.app.state.event_manager.list()]


@router.get("/telemetry")
async def get_telemetry(request: Request) -> dict:
    return request.app.state.telemetry_service.snapshot().model_dump(mode="json")


@router.post("/system/reset")
async def reset_system(request: Request) -> CommandResponse:
    state_manager = request.app.state.state_manager
    event_manager = request.app.state.event_manager
    websocket_manager = request.app.state.websocket_manager
    mqtt = request.app.state.mqtt

    state_manager.set_state(SystemState.IDLE)
    mqtt.publish("system/state", json.dumps({"state": SystemState.IDLE}))
    event = event_manager.add(
        source="operator",
        event_type="SYSTEM_RESET",
        severity=EventSeverity.INFO,
        message="Alerts reset; system returned to IDLE",
    )
    await websocket_manager.broadcast("state", state_manager.snapshot().model_dump(mode="json"))
    await websocket_manager.broadcast("event", event.model_dump(mode="json"))
    await websocket_manager.broadcast("events", [item.model_dump(mode="json") for item in event_manager.list()])
    return CommandResponse(accepted=True, command="reset", state=state_manager.state)


@router.post("/system/emergency-stop")
async def emergency_stop(request: Request) -> CommandResponse:
    response = request.app.state.robot_service.emergency_stop()
    event_manager = request.app.state.event_manager
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast("state", request.app.state.state_manager.snapshot().model_dump(mode="json"))
    await websocket_manager.broadcast("events", [item.model_dump(mode="json") for item in event_manager.list()])
    return response
