#include <WiFi.h>
#include <PubSubClient.h>
#include "HX711.h"
#include "DHT.h"
#include <ArduinoJson.h>

// =======================
// WIFI CONFIG
// =======================

const char* ssid = "Believe It";
const char* password = "6295141.3";

// MQTT Broker IP
const char* mqtt_server = "10.149.201.155";

// =======================
// PIN DEFINITIONS
// =======================

// HX711
#define HX711_DT 4
#define HX711_SCK 5

// Ultrasonic
#define TRIG_PIN 25
#define ECHO_PIN 26

// DHT22
#define DHT_PIN 15
#define DHT_TYPE DHT22

// =======================
// OBJECTS
// =======================

WiFiClient espClient;
PubSubClient client(espClient);

HX711 scale;
DHT dht(DHT_PIN, DHT_TYPE);

// =======================
// VARIABLES
// =======================

long duration;
float distanceCm;

float temperature;
float humidity;

float weight;

// Change this after calibration
float calibration_factor = -300.0;

// =======================
// WIFI
// =======================

void setup_wifi() {
  delay(10);

  Serial.println();
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected");
  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

// =======================
// MQTT RECONNECT
// =======================

void reconnectMQTT() {
  while (!client.connected()) {

    Serial.print("Connecting to MQTT...");

    String clientId = "ESP32WarehouseNode-";
    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" retrying in 2 sec");
      delay(2000);
    }
  }
}

// =======================
// READ ULTRASONIC
// =======================

float readUltrasonic() {

  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  duration = pulseIn(ECHO_PIN, HIGH);

  distanceCm = duration * 0.034 / 2;

  return distanceCm;
}

// =======================
// SETUP
// =======================

void setup() {

  Serial.begin(115200);

  // Ultrasonic
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // DHT
  dht.begin();

  // HX711
  scale.begin(HX711_DT, HX711_SCK);

  scale.set_scale(calibration_factor);
  scale.tare();

  Serial.println("HX711 initialized");

  setup_wifi();

  client.setServer(mqtt_server, 1883);
}

// =======================
// LOOP
// =======================

void loop() {

  if (!client.connected()) {
    reconnectMQTT();
  }

  client.loop();

  // =======================
  // READ SENSORS
  // =======================

  distanceCm = readUltrasonic();

  temperature = dht.readTemperature();
  humidity = dht.readHumidity();

  weight = scale.get_units(5)/1000;

  // =======================
  // SERIAL DEBUG
  // =======================

  Serial.println("---------------");

  Serial.print("Distance: ");
  Serial.print(distanceCm);
  Serial.println(" cm");

  Serial.print("Temperature: ");
  Serial.print(temperature);
  Serial.println(" C");

  Serial.print("Humidity: ");
  Serial.print(humidity);
  Serial.println(" %");

  Serial.print("Weight: ");
  Serial.print(weight);
  Serial.println(" g");

  // =======================
  // MQTT PUBLISH
  // =======================

  // LOAD CELL
  StaticJsonDocument<128> loadDoc;

  loadDoc["weight"] = weight;

  char loadBuffer[128];

  serializeJson(loadDoc, loadBuffer);

  client.publish("sensor/loadcell", loadBuffer);

  // ULTRASONIC
  StaticJsonDocument<128> ultraDoc;

  ultraDoc["distance"] = distanceCm;

  char ultraBuffer[128];

  serializeJson(ultraDoc, ultraBuffer);

  client.publish("sensor/ultrasonic", ultraBuffer);

  // DHT22
  StaticJsonDocument<128> dhtDoc;

  dhtDoc["temperature"] = temperature;
  dhtDoc["humidity"] = humidity;

  char dhtBuffer[128];

  serializeJson(dhtDoc, dhtBuffer);

  client.publish("sensor/dht22", dhtBuffer);

  // =======================
  // OPTIONAL EVENTS
  // =======================

  // =======================
  // DELIVERY COMPLETE
  // =======================

  static bool packagePresent = false;
  static unsigned long unloadTime = 0;
  static bool deliverySent = false;

  // Package detected
  if (weight > 1) {

    packagePresent = true;
    deliverySent = false;
    unloadTime = 0;
    StaticJsonDocument<128> eventDoc;

    eventDoc["type"] = "PACKAGE_COLLECTED";
    eventDoc["message"] = "Package detected on rover";

    char eventBuffer[128];

    serializeJson(eventDoc, eventBuffer);

    client.publish("system/event", eventBuffer);
  }

  // Package removed
  if (packagePresent && weight < 0.5) {

    if (unloadTime == 0) {
      unloadTime = millis();
    }

    // Wait 2 sec after unload
    if ((millis() - unloadTime > 2000) && !deliverySent) {

      StaticJsonDocument<128> deliveryDoc;

      deliveryDoc["type"] = "DELIVERY_COMPLETE";
      deliveryDoc["message"] = "Delivery complete";

      char deliveryBuffer[128];

      serializeJson(deliveryDoc, deliveryBuffer);

      client.publish("system/event", deliveryBuffer);

      Serial.println("DELIVERY COMPLETE SENT");

      deliverySent = true;
      packagePresent = false;
    }
  }

  // INTRUSION ALERT
  if (distanceCm < 20) {

    StaticJsonDocument<128> alertDoc;

    alertDoc["type"] = "PROXIMITY_ALERT";
    alertDoc["message"] = "Restricted zone intrusion detected";

    char alertBuffer[128];

    serializeJson(alertDoc, alertBuffer);

    client.publish("system/event", alertBuffer);
  }

  delay(2000);
}