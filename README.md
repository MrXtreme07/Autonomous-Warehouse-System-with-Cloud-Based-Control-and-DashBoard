# Autonomous Warehouse Management System

A futuristic event-driven Autonomous Warehouse Management System integrating Robotics, IoT, MQTT communication, and a real-time industrial monitoring dashboard.

Built for Raspberry Pi + ESP32 based warehouse automation workflows.

---

# Overview

This project simulates and controls an industrial smart warehouse environment using:

- Autonomous mobile robot telemetry
- IoT sensor integration
- RFID-based access control
- MQTT event-driven communication
- FastAPI orchestration backend
- Real-time React dashboard
- Manual override and safety systems

The system architecture is designed around centralized orchestration and real-time telemetry rather than standalone robot control.

---

# Features

## Real-Time Dashboard
- Industrial futuristic monitoring UI
- Live telemetry updates
- Mission workflow visualization
- Event timeline logging
- WebSocket-based live updates
- Manual override controls

---

## IoT Integration
- ESP32 sensor node support
- MQTT communication architecture
- Real-time event broadcasting
- Distributed sensor integration

---

## Warehouse Safety
- Ultrasonic restricted-zone detection
- DHT22 environment monitoring
- Emergency stop system
- Safety-aware state transitions

---

## RFID Access Control
- Authorized operator validation
- Warehouse lock/unlock states
- Event-driven authentication flow

---

## Robot Telemetry
- Robot state tracking
- Movement status monitoring
- Speed telemetry
- Online/offline heartbeat monitoring

---

## Smart Package Validation
- Load cell based package confirmation
- Event-triggered mission updates
- Smart node telemetry integration

---

# System Architecture

```text
ESP32 Sensors / Robot Telemetry
                ↓
         MQTT (Mosquitto)
                ↓
        FastAPI Backend
                ↓
      WebSocket + REST API
                ↓
      React Monitoring Dashboard
```

---

# Tech Stack

## Frontend
- React + Vite
- TailwindCSS
- shadcn/ui
- Framer Motion
- Lucide React

---

## Backend
- FastAPI
- WebSockets
- paho-mqtt
- Uvicorn

---

## Communication
- MQTT (Mosquitto Broker)
- REST APIs
- WebSockets

---

## Hardware
- Raspberry Pi
- ESP32
- Load Cell + HX711
- Ultrasonic Sensor
- DHT22
- RFID Reader

---

# System States

The warehouse orchestration system currently supports:

- `LOCKED`
- `IDLE`
- `ACTIVE`
- `PAUSED`
- `ERROR`

---

# MQTT Topics

## Sensor Topics
```text
sensor/loadcell
sensor/ultrasonic
sensor/dht22
```

## RFID
```text
rfid/access
```

## Robot Telemetry
```text
robot/status
robot/state
robot/speed
```

## System
```text
system/state
system/event
robot/command
```

---

# Backend API

## REST Endpoints

```text
GET  /state
GET  /events
GET  /telemetry

POST /robot/deploy
POST /robot/pause
POST /robot/resume
POST /robot/return

POST /system/reset
POST /system/emergency-stop
```

---

# WebSocket Endpoint

```text
/ws
```

Provides:
- live system state updates
- telemetry streaming
- event timeline updates
- robot status broadcasting

---

# Project Structure

```text
src/AutoWarehouse/
│
├── backend/
│   ├── app/
│   ├── simulator.py
│   ├── requirements.txt
│   └── README.md
│
├── src/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   └── pages/
│
└── public/
```

---

# Running the Project

## 1. Install Mosquitto

```bash
sudo apt update
sudo apt install mosquitto mosquitto-clients
```

Enable Mosquitto:

```bash
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

---

## 2. Run Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 3. Run Frontend

```bash
npm install
npm run dev
```

---

## 4. Run Simulator (Optional)

```bash
cd backend
python simulator.py
```

This simulates:
- RFID authentication
- robot movement
- package confirmation
- ultrasonic alerts
- environment telemetry

without requiring hardware.

---

# Testing MQTT Events

## RFID Authentication

```bash
mosquitto_pub -t rfid/access -m '{"user":"Anirudh","status":"AUTHORIZED"}'
```

---

## Package Confirmation

```bash
mosquitto_pub -t sensor/loadcell -m '{"weight":520}'
```

---

## Ultrasonic Alert

```bash
mosquitto_pub -t sensor/ultrasonic -m '{"distance":10}'
```

---

# Design Philosophy

This project focuses on:

- Event-driven system orchestration
- Real telemetry integration
- Industrial operational design
- Modular IoT architecture
- Scalable robotics infrastructure

Instead of:
- fake AI analytics
- unrealistic warehouse simulations
- overcomplicated swarm logic

The emphasis is on robust system architecture and real-time operational behavior.

---

# Future Improvements

- Real ESP32 sensor deployment
- Physical robot integration
- Persistent event database
- Multi-robot coordination
- ROS2 integration
- Smart task scheduling
- Remote cloud deployment

---

# License

MIT License