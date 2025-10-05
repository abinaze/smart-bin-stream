// BinSense IoT Device Code for ESP8266 with HMAC Authentication
// Hardware: NodeMCU ESP8266 + 2x Ultrasonic Sensors (HC-SR04) + RGB LED
// Security: HMAC-SHA256 signature verification, timestamp validation, nonce protection

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <bearssl/bearssl_hmac.h>
#include <time.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// BinSense Configuration - GET THESE FROM DASHBOARD
const char* serverUrl = "https://nzcqvwxnrcljpokgzqvp.supabase.co/functions/v1/device-update";
const char* dustbinCode = "BIN-001";  // Your unique dustbin code
const char* deviceSecret = "YOUR_DEVICE_SECRET";  // COPY FROM DASHBOARD - SHOWN ONLY ONCE!

// Ultrasonic Sensor pins
#define TRIG_PIN_1 D1
#define ECHO_PIN_1 D2
#define TRIG_PIN_2 D3
#define ECHO_PIN_2 D4

// RGB LED pins
#define RED_PIN D5
#define GREEN_PIN D6
#define BLUE_PIN D7

// Configuration
#define BIN_HEIGHT 100  // Dustbin height in cm
#define FIRMWARE_VERSION "1.0.0"

// NTP Configuration
const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 0;
const int   daylightOffset_sec = 3600;

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
  
  // Initialize time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  Serial.println("Waiting for time sync...");
  while (!time(nullptr)) {
    Serial.print(".");
    delay(1000);
  }
  Serial.println("\nTime synchronized");
}

void loop() {
  // Read both sensors
  float distance1 = readUltrasonicSensor(TRIG_PIN_1, ECHO_PIN_1);
  float distance2 = readUltrasonicSensor(TRIG_PIN_2, ECHO_PIN_2);
  
  // Calculate fill percentage
  float avgDistance = (distance1 + distance2) / 2.0;
  float fillPercentage = ((BIN_HEIGHT - avgDistance) / BIN_HEIGHT) * 100.0;
  fillPercentage = constrain(fillPercentage, 0, 100);
  
  Serial.print("Sensor 1: "); Serial.print(distance1); Serial.print(" cm | ");
  Serial.print("Sensor 2: "); Serial.print(distance2); Serial.print(" cm | ");
  Serial.print("Fill: "); Serial.print(fillPercentage); Serial.println("%");
  
  // Update LED color
  updateLED(fillPercentage);
  
  // Send authenticated data to server
  sendAuthenticatedData(distance1, distance2);
  
  delay(10000); // Update every 10 seconds
}

float readUltrasonicSensor(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  
  long duration = pulseIn(echoPin, HIGH);
  float distance = duration * 0.034 / 2;
  
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

// Generate HMAC-SHA256 signature
String generateHMAC(String payload, String secret) {
  uint8_t hmacResult[32];
  
  br_hmac_key_context keyCtx;
  br_hmac_key_init(&keyCtx, &br_sha256_vtable, secret.c_str(), secret.length());
  
  br_hmac_context hmacCtx;
  br_hmac_init(&hmacCtx, &keyCtx, 0);
  br_hmac_update(&hmacCtx, payload.c_str(), payload.length());
  br_hmac_out(&hmacCtx, hmacResult);
  
  // Convert to hex string
  String hmacHex = "";
  for (int i = 0; i < 32; i++) {
    char hex[3];
    sprintf(hex, "%02x", hmacResult[i]);
    hmacHex += hex;
  }
  
  return hmacHex;
}

// Generate unique nonce
String generateNonce() {
  String nonce = "";
  for (int i = 0; i < 16; i++) {
    nonce += String(random(0, 16), HEX);
  }
  return nonce;
}

// Get ISO 8601 timestamp
String getTimestamp() {
  time_t now = time(nullptr);
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(buffer);
}

void sendAuthenticatedData(float sensor1, float sensor2) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    
    http.begin(client, serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Generate timestamp and nonce
    String timestamp = getTimestamp();
    String nonce = generateNonce();
    
    // Create payload (must match server-side order!)
    String payload = "{\"dustbin_code\":\"" + String(dustbinCode) + 
                    "\",\"sensor1_value\":" + String(sensor1, 2) + 
                    ",\"sensor2_value\":" + String(sensor2, 2) + 
                    ",\"timestamp\":\"" + timestamp + 
                    "\",\"nonce\":\"" + nonce + "\"}";
    
    // Generate HMAC signature
    String signature = generateHMAC(payload, String(deviceSecret));
    
    // Add signature to payload
    String jsonData = "{\"dustbin_code\":\"" + String(dustbinCode) + 
                     "\",\"sensor1_value\":" + String(sensor1, 2) + 
                     ",\"sensor2_value\":" + String(sensor2, 2) + 
                     ",\"timestamp\":\"" + timestamp + 
                     "\",\"nonce\":\"" + nonce + 
                     "\",\"signature\":\"" + signature + 
                     "\",\"firmware_version\":\"" + String(FIRMWARE_VERSION) + "\"}";
    
    Serial.println("Sending: " + jsonData);
    
    int httpCode = http.POST(jsonData);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Server response: " + response);
      
      if (httpCode != 200) {
        Serial.println("Error: HTTP " + String(httpCode));
      }
    } else {
      Serial.println("Error sending data: " + String(httpCode));
    }
    
    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
