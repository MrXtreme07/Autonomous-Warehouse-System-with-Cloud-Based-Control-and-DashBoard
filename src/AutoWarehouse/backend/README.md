# Autonomous Warehouse Backend

FastAPI backend for the Raspberry Pi-hosted Autonomous Warehouse Management System. It acts as the orchestration layer between ESP32 MQTT sensor nodes, Raspberry Pi robot telemetry, and the React dashboard.

## Setup

```bash
cd src/AutoWarehouse/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Install and start Mosquitto on Ubuntu/Raspberry Pi:

```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable --now mosquitto
```

## Run Backend

```bash
cd src/AutoWarehouse/backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Environment variables:

```bash
export MQTT_HOST=localhost
export MQTT_PORT=1883
```

## REST API

- `GET /state`
- `GET /events`
- `GET /telemetry`
- `POST /robot/deploy`
- `POST /robot/pause`
- `POST /robot/resume`
- `POST /robot/return`
- `POST /system/reset`
- `POST /system/emergency-stop`

## WebSocket

Dashboard clients connect to:

```text
ws://localhost:8000/ws
```

Messages are JSON:

```json
{
  "type": "telemetry",
  "payload": {}
}
```

Broadcast types include `state`, `event`, `events`, and `telemetry`.

## Simulator

Run fake hardware telemetry without ESP32/Raspberry Pi nodes:

```bash
cd src/AutoWarehouse/backend
source .venv/bin/activate
python simulator.py
```

You can also publish test messages manually:

```bash
mosquitto_pub -t rfid/access -m '{"user":"Anirudh","status":"AUTHORIZED"}'
mosquitto_pub -t sensor/loadcell -m '{"weight":520}'
mosquitto_pub -t sensor/ultrasonic -m '{"distance":18}'
mosquitto_pub -t robot/state -m '{"state":"MOVING"}'
```
