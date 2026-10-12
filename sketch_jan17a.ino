#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

const char* ssid = "OPPOReno75G";
const char* password = "Rishu1234";

const char* serverURL = "https://compassionate-happiness-production-399f.up.railway.app/api/iot/bin-update";

#define TRIG 32
#define ECHO 33

#define GREEN_LED 18
#define RED_LED 19
#define YELLOW_LED 21

#define BIN_HEIGHT 15.0   // cm

void setup() {
  Serial.begin(115200);

  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  pinMode(YELLOW_LED, OUTPUT);

  digitalWrite(GREEN_LED, LOW);
  digitalWrite(RED_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);

  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
}

long getDistance() {
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  long duration = pulseIn(ECHO, HIGH, 30000);
  if (duration == 0) return BIN_HEIGHT;

  return duration * 0.034 / 2;
}

void loop() {
  float distance = getDistance();

  if (distance > BIN_HEIGHT) distance = BIN_HEIGHT;
  if (distance < 0) distance = 0;

  int fill = ((BIN_HEIGHT - distance) / BIN_HEIGHT) * 100;
  fill = constrain(fill, 0, 100);

  // Turn off LEDs
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(YELLOW_LED, LOW);
  digitalWrite(RED_LED, LOW);

  // LED logic
  if (fill < 30) {
    digitalWrite(GREEN_LED, HIGH);
  } else if (fill < 80) {
    digitalWrite(RED_LED, HIGH);
  } else {
    digitalWrite(YELLOW_LED, HIGH);
  }

  Serial.print("Distance: ");
  Serial.print(distance);
  Serial.print(" cm | Fill: ");
  Serial.print(fill);
  Serial.println(" %");

  // Send to backend
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClientSecure client;
    client.setInsecure(); // Required for HTTPS on ESP32 without root certificate bundle

    HTTPClient http;
    http.begin(client, serverURL);
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"bin_id\":\"BIN_001\",";
    json += "\"distance\":" + String(distance) + ",";
    json += "\"fill_percentage\":" + String(fill) + ",";
    json += "\"device_id\":\"esp32_001\"";
    json += "}";

    int code = http.POST(json);
    Serial.println("Response: " + String(code));
    http.end();
  }

  delay(5000); // update every 5 seconds
}
