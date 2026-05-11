# Autonomous Warehouse System — Backend Implementation Prompt for Codex

Use this prompt directly with Codex / Cursor / Windsurf AI.

---

# PROMPT

Build the backend for a Raspberry Pi-hosted Autonomous Warehouse Management System.

Tech Stack:

* Python 3.11+
* FastAPI
* WebSockets
* MQTT using paho-mqtt
* Mosquitto broker
* Uvicorn
* Async architecture where appropriate

The backend should act as the CENTRAL ORCHESTRATION LAYER between:

* ESP32 sensor nodes
* Raspberry Pi robot telemetry
* React frontend dashboard

The frontend dashboard already exists.

The backend must:

1. Subscribe to MQTT topics
2. Maintain system state
3. Process events
4. Broadcast live updates to frontend via WebSockets
5. Expose REST endpoints for manual override controls
6. Generate event timeline entries

IMPORTANT:
This is an INDUSTRIAL EVENT-DRIVEN SYSTEM.
Avoid fake analytics or unnecessary abstractions.
Keep architecture clean and modular.

---

# SYSTEM STATES

Supported states:

* LOCKED
* IDLE
* ACTIVE
* PAUSED
* ERROR

State changes should be centralized.

---

# MQTT TOPICS

Subscribe to:

sensor/loadcell
sensor/ultrasonic
sensor/dht22
rfid/access
robot/status
robot/state
robot/speed
system/event

Publish to:

system/state
system/event
robot/command

---

# EXPECTED MQTT PAYLOADS

Example:

rfid/access
{
"user": "Anirudh",
"status": "AUTHORIZED"
}

sensor/loadcell
{
"weight": 520
}

sensor/ultrasonic
{
"distance": 18
}

robot/state
{
"state": "MOVING"
}

---

# EVENT MODEL

Create a centralized event structure:

{
"timestamp": "21:14:02",
"source": "loadcell",
"type": "PACKAGE_CONFIRMED",
"severity": "info",
"message": "Package confirmed by load cell"
}

Store recent events in memory.
Keep latest 100 events.

---

# BACKEND RESPONSIBILITIES

## RFID AUTHENTICATION

If:
{
"status": "AUTHORIZED"
}

Then:

* system state becomes IDLE if previously LOCKED
* generate event
* notify frontend

If unauthorized:

* generate AUTH_FAILURE event
* system state remains LOCKED

---

## LOAD CELL LOGIC

If weight > 300:

* generate PACKAGE_CONFIRMED event
* notify frontend

---

## ULTRASONIC SAFETY LOGIC

If distance < 20:

* system state becomes PAUSED
* generate PROXIMITY_ALERT event
* notify frontend

---

## ROBOT STATE

Maintain latest robot telemetry:

* state
* speed
* online/offline
* last heartbeat

If heartbeat timeout > 10 seconds:

* mark robot OFFLINE
* generate COMMUNICATION_LOSS event

---

# FASTAPI REQUIREMENTS

Create:

## REST API

GET /state
Returns current system state.

GET /events
Returns latest events.

GET /telemetry
Returns latest telemetry snapshot.

POST /robot/deploy
Publishes deploy command.

POST /robot/pause
Publishes pause command.

POST /robot/resume
Publishes resume command.

POST /robot/return
Publishes return-to-base command.

POST /system/reset
Resets alerts and returns system to IDLE.

POST /system/emergency-stop
Sets system state to ERROR.
Publishes emergency stop event.

---

# WEBSOCKET REQUIREMENTS

Create:

/ws

Frontend connects once.

Broadcast:

* state updates
* new events
* telemetry updates
* robot updates

Use JSON messages.

---

# PROJECT STRUCTURE

backend/
├── app/
│   ├── main.py
│   ├── mqtt_client.py
│   ├── websocket_manager.py
│   ├── state_manager.py
│   ├── event_manager.py
│   ├── routes/
│   │   ├── system.py
│   │   └── robot.py
│   ├── models/
│   │   └── schemas.py
│   └── services/
│       ├── telemetry_service.py
│       └── robot_service.py
├── requirements.txt
└── README.md

---

# IMPORTANT IMPLEMENTATION RULES

* Keep code modular and readable.
* Avoid unnecessary enterprise abstractions.
* Use Pydantic models.
* Use centralized state management.
* Use logging.
* Handle malformed MQTT payloads safely.
* Use async WebSocket broadcasting.
* Include comments explaining architecture.

---

# MOCK/SIMULATION SUPPORT

Include a simulator.py script that publishes fake MQTT telemetry every few seconds for:

* RFID auth
* robot movement
* load cell package confirmation
* ultrasonic alerts
* DHT22 data

This should allow full backend testing without hardware.

---

# README REQUIREMENTS

Include setup instructions for:

* Python venv
* Mosquitto installation
* Running FastAPI
* Running simulator
* Testing WebSocket updates

---

# OUTPUT REQUIREMENTS

Generate:

* complete backend code
* proper project structure
* requirements.txt
* runnable implementation
* clear comments
* production-style modular organization

The backend should be immediately runnable locally on Ubuntu and suitable for deployment on Raspberry Pi.
