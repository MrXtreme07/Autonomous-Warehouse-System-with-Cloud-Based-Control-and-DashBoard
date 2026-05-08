from __future__ import annotations

from fastapi import APIRouter, Request

from app.models.schemas import CommandResponse

router = APIRouter(prefix="/robot")


@router.post("/deploy")
async def deploy_robot(request: Request) -> CommandResponse:
    return await _send_and_broadcast(request, "deploy")


@router.post("/pause")
async def pause_robot(request: Request) -> CommandResponse:
    return await _send_and_broadcast(request, "pause")


@router.post("/resume")
async def resume_robot(request: Request) -> CommandResponse:
    return await _send_and_broadcast(request, "resume")


@router.post("/return")
async def return_robot(request: Request) -> CommandResponse:
    return await _send_and_broadcast(request, "return")


async def _send_and_broadcast(request: Request, command: str) -> CommandResponse:
    response = request.app.state.robot_service.send_command(command)
    events = [event.model_dump(mode="json") for event in request.app.state.event_manager.list()]
    await request.app.state.websocket_manager.broadcast(
        "state",
        request.app.state.state_manager.snapshot().model_dump(mode="json"),
    )
    await request.app.state.websocket_manager.broadcast("events", events)
    return response
