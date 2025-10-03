// BinSense IoT Device Code for ESP8266
// Hardware: NodeMCU ESP8266 + 2x Ultrasonic Sensors (HC-SR04) + RGB LED

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API endpoint - Replace with your actual Lovable Cloud project URL
const char* serverUrl = "https://nzcqvwxnrcljpokgzqvp.supabase.co/functions/v1/device-update";

// Your dustbin ID
const char* dustbinId = "BIN-001";

// Ultrasonic Sensor 1 pins
#define TRIG_PIN_1 D1
#define ECHO_PIN_1 D2

// Ultrasonic Sensor 2 pins
#define TRIG_PIN_2 D3
#define ECHO_PIN_2 D4

// RGB LED pins
#define RED_PIN D5
#define GREEN_PIN D6
#define BLUE_PIN D7

// Dustbin height in cm (adjust based on your bin)
#define BIN_HEIGHT 100

void setup() {
  Serial.begin(115200);
  
  // Initialize sensor pins
  pinMode(TRIG_PIN_1, OUTPUT);
  pinMode(ECHO_PIN_1, INPUT);
  pinMode(TRIG_PIN_2, OUTPUT);
  pinMode(ECHO_PIN_2, INPUT);
  
  // Initialize LED pins
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
}

void loop() {
  // Read both sensors
  float distance1 = readUltrasonicSensor(TRIG_PIN_1, ECHO_PIN_1);
  float distance2 = readUltrasonicSensor(TRIG_PIN_2, ECHO_PIN_2);
  
  // Calculate fill percentage (average)
  float avgDistance = (distance1 + distance2) / 2.0;
  float fillPercentage = ((BIN_HEIGHT - avgDistance) / BIN_HEIGHT) * 100.0;
  fillPercentage = constrain(fillPercentage, 0, 100);
  
  Serial.print("Sensor 1: "); Serial.print(distance1); Serial.print(" cm | ");
  Serial.print("Sensor 2: "); Serial.print(distance2); Serial.print(" cm | ");
  Serial.print("Fill: "); Serial.print(fillPercentage); Serial.println("%");
  
  // Update LED color based on fill level
  updateLED(fillPercentage);
  
  // Send data to server
  sendDataToServer(fillPercentage, distance1, distance2);
  
  delay(10000); // Update every 10 seconds
}

float readUltrasonicSensor(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2; // Convert to cm
  
  return distance;
}

void updateLED(float fillPercentage) {
  if (fillPercentage < 50) {
    // Green - Low fill
    analogWrite(RED_PIN, 0);
    analogWrite(GREEN_PIN, 255);
    analogWrite(BLUE_PIN, 0);
  } else if (fillPercentage < 75) {
    // Yellow - Medium fill
    analogWrite(RED_PIN, 255);
    analogWrite(GREEN_PIN, 255);
    analogWrite(BLUE_PIN, 0);
  } else {
    // Red - High fill
    analogWrite(RED_PIN, 255);
    analogWrite(GREEN_PIN, 0);
    analogWrite(BLUE_PIN, 0);
  }
}

void sendDataToServer(float fillPercentage, float sensor1, float sensor2) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String jsonData = "{\"dustbin_id\":\"" + String(dustbinId) + 
                     "\",\"sensor1_value\":" + String(sensor1) + 
                     ",\"sensor2_value\":" + String(sensor2) + "}";
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);
    } else {
      Serial.println("Error sending data");
    }
    
    http.end();
  }
}