# KAVACH-BMS

**Kinetic & Autonomous Virtual-Sensing Architecture for Contested High-Altitude Battery Management Systems**

An Edge-AI and Digital Twin battery-monitoring platform designed for high-altitude tactical avionics and uncrewed aerial systems.

## Project Modules
- Tactical 4S battery topology and degraded-mode simulation
- Two-node thermal model and Kalman virtual core-temperature estimate
- Impedance, VOC and thermal diagnostic indicators
- ICA/DVA visualization and SOH/RUL model interface
- Sub-zero pulse-warming charging simulation
- Second-life battery assessment report
- Optional FastAPI backend and ESP32 telemetry bridge

## Repository Structure

```text
kavach-bms/
├── index.html
├── backend_server.py
├── requirements.txt
├── docs/
│   ├── PRD.md
│   ├── TRD.md
│   ├── DESIGN.md
│   ├── ARCHITECTURE.md
│   ├── TECH_STACK.md
│   ├── API_SPEC.md
│   ├── DATABASE_SCHEMA.md
│   └── IMPLEMENTATION_PLAN.md
└── README.md
```

## Run the Frontend
If the frontend is implemented as a self-contained HTML file, open `index.html` in a modern browser.

For Web Serial support, use a supported Chromium-based browser and a secure context (localhost or HTTPS). Device access requires user permission.

## Run the Optional Backend

Create a virtual environment and install dependencies:

```bash
python -m venv .venv

# Windows
.venv\\Scripts\\activate

# Linux / macOS
source .venv/bin/activate

pip install fastapi uvicorn pydantic
```

Start the API:

```bash
uvicorn backend_server:app --reload --host 127.0.0.1 --port 8000
```

Open the API documentation at:

```text
http://127.0.0.1:8000/docs
```

## Three-Minute Demo Flow
1. **Fault scenario:** Show strict-shutdown simulation, then degraded-mode simulation, and compare the displayed bus state.
2. **Thermal twin:** Inject a high-load or thermal scenario and compare surface temperature with estimated core temperature.
3. **Lifecycle:** Demonstrate the cold-weather charging simulation, lower the simulated SOH below the configured threshold, and generate a second-life assessment report.

## Important Safety and Validation Notice
This repository describes a prototype. Simulated values are not experimental evidence. Do not connect this software to a live battery pack, charger, UAV propulsion system or MOSFET switching circuit without a qualified electrical/battery engineer's review, independent protection circuitry, cell-specific limits and controlled validation.

The terms “passport”, “certification”, “defense-grade”, “safe” and “mission-ready” must not be used as claims of formal certification or operational readiness.

## Documentation
See the files in `docs/` for product, technical, design, architecture, API, database and implementation details.
