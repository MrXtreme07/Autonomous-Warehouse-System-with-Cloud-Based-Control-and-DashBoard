from __future__ import annotations

import json
import random
import time
from itertools import cycle

import paho.mqtt.client as mqtt

HOST = "localhost"
PORT = 1883


def publish_json(client: mqtt.Client, topic: str, payload: dict) -> None:
    client.publish(topic, json.dumps(payload))
    print(f"{topic}: {payload}")


def main() -> None:
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.connect(HOST, PORT, keepalive=30)
    client.loop_start()

    robot_states = cycle(["IDLE", "MOVING", "MOVING", "RETURNING"])
    users = cycle(
        [
            {"user": "Anirudh", "status": "AUTHORIZED"},
            {"user": "Guest", "status": "DENIED"},
        ]
    )

    try:
        while True:
            publish_json(client, "rfid/access", next(users))
            time.sleep(1)
            publish_json(client, "robot/state", {"state": next(robot_states)})
            publish_json(client, "robot/speed", {"speed": round(random.uniform(0.2, 0.9), 2)})
            publish_json(
                client,
                "robot/status",
                {
                    "battery": round(random.uniform(40, 95), 1),
                    "position": {"x": round(random.uniform(0, 10), 2), "y": round(random.uniform(0, 8), 2)},
                },
            )
            time.sleep(1)
            publish_json(client, "sensor/loadcell", {"weight": random.choice([0, 120, 520, 740])})
            publish_json(client, "sensor/ultrasonic", {"distance": random.choice([12, 18, 45, 90, 150])})
            publish_json(
                client,
                "sensor/dht22",
                {"temperature": round(random.uniform(22, 34), 1), "humidity": round(random.uniform(40, 72), 1)},
            )
            time.sleep(3)
    except KeyboardInterrupt:
        print("Simulator stopped")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
