# KAVACH-BMS — API Specification

## 1. Base Configuration
- REST base URL: `http://localhost:8000/api/v1`
- WebSocket: `ws://localhost:8000/ws/telemetry`
- Content type: `application/json`

These are proposed local-development routes; implement and test them before treating this contract as operational.

## 2. Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/telemetry/current` | Return latest pack and cell telemetry |
| POST | `/faults/inject` | Trigger a software-only test fault |
| POST | `/doctrine/mode` | Change simulation operating doctrine |
| GET | `/prognostics/ica` | Return ICA curve and health estimates |
| POST | `/passport/generate` | Generate a second-life assessment report |

## 3. Example Telemetry Payload

```json
{
  "timestamp_ms": 1761842160000,
  "source": "SIMULATION",
  "pack_mode": "KAVACH_DEGRADED",
  "active_topology": "3S1P_BOOST_ACTIVE",
  "pack_voltage_v": 11.12,
  "regulated_bus_v": 12.0,
  "pack_current_a": 4.85,
  "ambient_temp_c": -18.0,
  "voc_gas_ppm": 182.4,
  "can_bus_integrity": "VERIFIED",
  "cells": [
    {
      "id": 1,
      "voltage_v": 3.71,
      "resistance_mohm": 34.2,
      "surface_temp_c": 26.4,
      "estimated_core_temp_c": 34.1,
      "bypassed": false
    },
    {
      "id": 2,
      "voltage_v": 0.0,
      "resistance_mohm": 148.9,
      "surface_temp_c": 39.2,
      "estimated_core_temp_c": 58.7,
      "bypassed": true
    }
  ],
  "prognostics": {
    "soc_pct": 76.4,
    "soh_pct": 78.2,
    "rul_cycles": 142,
    "model_version": "demo-0.1",
    "model_status": "SIMULATED"
  }
}
```

## 4. Fault Injection Request

```json
{
  "fault_type": "cell2_short",
  "mode": "SIMULATION"
}
```

Supported demo fault identifiers:
- `cell2_short`
- `voc_spike`
- `subzero_ladakh`
- `can_spoof`
- `reset`

Fault injection must be disabled or strictly isolated from physical actuator commands in hardware-connected mode.

## 5. Doctrine Request

```json
{
  "doctrine": "KAVACH_DEGRADED"
}
```

Allowed demo values:
- `KAVACH_DEGRADED`
- `CIVILIAN_STRICT`

## 6. WebSocket Event
Each telemetry message should include:
- `timestamp_ms`
- `source`
- `sequence_number`
- `pack_id`
- `cells`
- `pack_status`
- `quality`

The client must detect stale, duplicate and out-of-order messages.

## 7. API Security
- Restrict CORS to known frontend origins.
- Validate every request with typed schemas and range checks.
- Add authentication before network exposure.
- Never accept arbitrary client-supplied actuator instructions.
- Log security-relevant events.
