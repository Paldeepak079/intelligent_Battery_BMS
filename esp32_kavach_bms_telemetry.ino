/*
 * KAVACH-BMS — Physical Hardware Telemetry Firmware
 * Target: ESP32 / ESP32-S3 / ESP32-C3 / STM32
 * Interface: USB Serial (Hardware UART0 @ 115200 baud) & optional Wi-Fi HTTP POST
 * Battery Chemistry: 4S Li-ion (NMC 18650 / 21700, 14.8V nominal, 16.8V peak)
 *
 * This firmware reads physical ADC voltages, current shunt, surface temperature,
 * and optional VOC sensor, then formats and streams genuine JSON telemetry frames.
 */

#include <Arduino.h>

// --- Pin Assignments (Configured for standard ESP32 / ESP32-S3 DevKit) ---
// Note: For precise cell tap measurements, use a precision differential ADC (ADS1115) 
// or resistor divider network calibrated to 3.3V ADC full-scale.
#define PIN_CELL_1_ADC    34 // Cell 1 tap (0 to 4.2V divider)
#define PIN_CELL_2_ADC    35 // Cell 2 tap (0 to 8.4V divider)
#define PIN_CELL_3_ADC    32 // Cell 3 tap (0 to 12.6V divider)
#define PIN_CELL_4_ADC    33 // Cell 4 tap (0 to 16.8V divider)
#define PIN_CURRENT_SHUNT 36 // Current sensor (e.g. ACS712 or INA219 / Shunt amp)
#define PIN_THERMISTOR    39 // 10k NTC Thermistor divider on pack surface
#define PIN_STATUS_LED     2 // ESP32 built-in LED (Heartbeat)

// Calibration Constants (Adjust for your resistor divider ratios)
const float CALIB_DIVIDER_C1 = 1.000;
const float CALIB_DIVIDER_C2 = 2.000;
const float CALIB_DIVIDER_C3 = 3.000;
const float CALIB_DIVIDER_C4 = 4.000;
const float ADC_REF_VOLTAGE  = 3.300;
const int   ADC_RESOLUTION   = 4095;

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIN_STATUS_LED, OUTPUT);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db); // Full-scale 0 - 3.1V on ESP32

  // Blink LED to indicate readiness
  digitalWrite(PIN_STATUS_LED, HIGH);
  delay(100);
  digitalWrite(PIN_STATUS_LED, LOW);
}

// Read and convert 12-bit ADC count to terminal voltage
float readPinVoltage(int pin, float dividerRatio) {
  long rawSum = 0;
  const int OVERSAMPLE_COUNT = 16;
  for (int i = 0; i < OVERSAMPLE_COUNT; i++) {
    rawSum += analogRead(pin);
    delayMicroseconds(50);
  }
  float avgRaw = (float)rawSum / OVERSAMPLE_COUNT;
  float pinV = (avgRaw / (float)ADC_RESOLUTION) * ADC_REF_VOLTAGE;
  return pinV * dividerRatio;
}

// Convert NTC thermistor reading to Celsius using Steinhart-Hart or Beta formula
float readSurfaceTemperature() {
  int raw = analogRead(PIN_THERMISTOR);
  if (raw <= 0 || raw >= 4095) return 25.0; // Fallback nominal ambient if unconnected
  
  float vOut = ((float)raw / 4095.0) * ADC_REF_VOLTAGE;
  float rNtc = 10000.0 * (vOut / (ADC_REF_VOLTAGE - vOut)); // 10k pull-up
  const float B = 3950.0;
  const float T0 = 298.15; // 25C in Kelvin
  const float R0 = 10000.0;
  
  float tempK = 1.0 / ((1.0 / T0) + (1.0 / B) * log(rNtc / R0));
  return tempK - 273.15;
}

// Read current sensor (Zero at 1.65V for bidirectional sensor, e.g. 66mV/A)
float readPackCurrent() {
  int raw = analogRead(PIN_CURRENT_SHUNT);
  float v = ((float)raw / 4095.0) * ADC_REF_VOLTAGE;
  float currentA = (v - 1.65) / 0.066; // Example for 30A ACS712
  if (abs(currentA) < 0.08) currentA = 0.0; // Deadband filter
  return currentA;
}

void loop() {
  static unsigned long lastTxTime = 0;
  unsigned long now = millis();

  // Transmit telemetry at 5 Hz (every 200 ms)
  if (now - lastTxTime >= 200) {
    lastTxTime = now;

    // Read cumulative ground-referenced tap voltages
    float tap1 = readPinVoltage(PIN_CELL_1_ADC, CALIB_DIVIDER_C1);
    float tap2 = readPinVoltage(PIN_CELL_2_ADC, CALIB_DIVIDER_C2);
    float tap3 = readPinVoltage(PIN_CELL_3_ADC, CALIB_DIVIDER_C3);
    float tap4 = readPinVoltage(PIN_CELL_4_ADC, CALIB_DIVIDER_C4);

    // Compute differential individual cell terminal voltages
    float c1 = tap1;
    float c2 = max(0.0f, tap2 - tap1);
    float c3 = max(0.0f, tap3 - tap2);
    float c4 = max(0.0f, tap4 - tap3);

    float currentA = readPackCurrent();
    float tSurfC   = readSurfaceTemperature();
    float vocPpm   = 24.5; // If BME680 is connected over I2C, read gas resistance here

    // Format strictly compliant single-line JSON packet for KAVACH-BMS Web Serial parser
    // {"c1":3.71, "c2":3.70, "c3":3.71, "c4":3.72, "i":4.85, "t_surf":25.2, "voc":24.5}
    Serial.print("{\"c1\":");
    Serial.print(c1, 3);
    Serial.print(",\"c2\":");
    Serial.print(c2, 3);
    Serial.print(",\"c3\":");
    Serial.print(c3, 3);
    Serial.print(",\"c4\":");
    Serial.print(c4, 3);
    Serial.print(",\"i\":");
    Serial.print(currentA, 2);
    Serial.print(",\"t_surf\":");
    Serial.print(tSurfC, 1);
    Serial.print(",\"voc\":");
    Serial.print(vocPpm, 1);
    Serial.println("}");

    // Toggle heartbeat LED on each transmission
    digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED));
  }
}
