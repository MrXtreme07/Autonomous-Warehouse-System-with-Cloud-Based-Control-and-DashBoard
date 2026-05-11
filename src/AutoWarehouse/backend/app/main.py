from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.event_manager import EventManager
from app.models.schemas import EventSeverity
from app.mqtt_client import MqttBridge
from app.routes import robot, system
from app.services.robot_service import RobotService
from app.services.telemetry_service import TelemetryService
from app.state_manager import StateManager
from app.websocket_manager import WebSocketManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


async def heartbeat_monitor(app: FastAPI) -> None:
    while True:
        await asyncio.sleep(2)
        went_offline = app.state.telemetry_service.mark_robot_offline_if_stale(timeout_seconds=10)
        if went_offline:
            event = app.state.event_manager.add(
                source="robot",
                event_type="COMMUNICATION_LOSS",
                severity=EventSeverity.ERROR,
                message="Robot heartbeat timeout exceeded",
            )
            await app.state.websocket_manager.broadcast(
                "telemetry",
                app.state.telemetry_service.snapshot().model_dump(mode="json"),
            )
            await app.state.websocket_manager.broadcast("event", event.model_dump(mode="json"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    loop = asyncio.get_running_loop()
    app.state.state_manager = StateManager()
    app.state.event_manager = EventManager(max_events=100)
    app.state.telemetry_service = TelemetryService()
    app.state.websocket_manager = WebSocketManager()
    app.state.mqtt = MqttBridge(
        state_manager=app.state.state_manager,
        event_manager=app.state.event_manager,
        telemetry_service=app.state.telemetry_service,
        websocket_manager=app.state.websocket_manager,
        loop=loop,
    )
    app.state.robot_service = RobotService(
        publisher=app.state.mqtt,
        state_manager=app.state.state_manager,
        event_manager=app.state.event_manager,
        telemetry_service=app.state.telemetry_service,
    )

    app.state.event_manager.add(
        source="system",
        event_type="BACKEND_STARTED",
        severity=EventSeverity.INFO,
        message="Backend orchestration service started",
    )
    app.state.mqtt.start()
    monitor_task = asyncio.create_task(heartbeat_monitor(app))

    try:
        yield
    finally:
        monitor_task.cancel()
        try:
            await monitor_task
        except asyncio.CancelledError:
            pass
        app.state.mqtt.stop()


app = FastAPI(
    title="Autonomous Warehouse Backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(robot.router)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    manager = websocket.app.state.websocket_manager
    await manager.connect(websocket)
    try:
        await manager.broadcast("state", websocket.app.state.state_manager.snapshot().model_dump(mode="json"))
        await manager.broadcast("telemetry", websocket.app.state.telemetry_service.snapshot().model_dump(mode="json"))
        await manager.broadcast(
            "events",
            [event.model_dump(mode="json") for event in websocket.app.state.event_manager.list()],
        )
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
    except Exception:
        logger.exception("WebSocket connection failed")
        await manager.disconnect(websocket)
