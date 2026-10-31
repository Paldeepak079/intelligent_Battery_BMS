# KAVACH-BMS — System Architecture

## 1. Overview
KAVACH-BMS is organized as a cyber-physical monitoring and decision-support prototype with four logical layers.

## 2. Architecture Layers

### Layer 1 — Physical Cell Matrix and Edge Sensing
Proposed hardware:
- 4S1P lithium-ion demonstration pack
- ESP32 or STM32 microcontroller
- INA219 voltage/current sensing
- NTC surface thermistors
- BME680 or another appropriately selected gas/VOC sensor
- Protected switching and measurement circuitry

Hardware selection, isolation, fusing, current ratings and thermal design require independent engineering review.

### Layer 2 — Signal Conditioning and Telemetry Validation
- Validate sensor ranges and timestamps.
- Filter obvious packet-loss spikes and invalid samples.
- Estimate resistance from valid current/voltage transitions.
- Derive charge/discharge features for ICA/DVA.
- Monitor communication integrity and suspicious telemetry patterns.

### Layer 3 — Digital Twin and AI Engine
- Two-node thermal reduced-order model.
- Kalman filter for virtual core-temperature estimation.
- Diagnostic rules for impedance, VOC and thermal indicators.
- SOH/RUL model and ICA/DVA analysis.
- Telemetry anomaly detection.

### Layer 4 — Command Center and Lifecycle Reporting
- Liquid-glass dashboard.
- Cell topology and mode visualization.
- Fault simulation and event audit log.
- Second-life assessment report.
- Hardware connection and telemetry health indicators.

## 3. Data Flow

```text
Battery Cells + Sensors
        |
        v
ESP32 / STM32 Firmware
        |
        | USB Serial / MQTT / WebSocket
        v
Telemetry Validation + Signal Conditioning
        |
        +--------------------+
        |                    |
        v                    v
Thermal Digital Twin     ICA / SOH / RUL Engine
        |                    |
        +---------+----------+
                  |
                  v
          API / WebSocket Layer
                  |
                  v
        Liquid Glass Command UI
                  |
                  v
       Audit Log + Second-Life Report
```

## 4. Communication
- Browser-to-device: Web Serial API where supported.
- Backend-to-device: serial bridge or MQTT adapter.
- UI-to-backend: REST for commands/queries and WebSocket for streaming.
- Use authenticated and encrypted transport for any network deployment.
- Treat browser-only simulation as a separate operating mode.

## 5. Operating Modes
1. **SIMULATION:** synthetic telemetry and software-only fault injection.
2. **HARDWARE_CONNECTED:** telemetry received from a connected device.
3. **STALE / DISCONNECTED:** no fresh telemetry; show last update time and disable hardware-dependent actions.

## 6. Safety Boundary
The software dashboard must not be the only protection layer. Independent analog protection, fuse coordination, contactors, cell-level monitoring, thermal safeguards and a validated hardware design are required before any physical battery switching or charging experiment.
