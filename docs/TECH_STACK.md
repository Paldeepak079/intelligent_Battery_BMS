# KAVACH-BMS — Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | HTML5, CSS3, ES2024 JavaScript | Browser-based command center |
| Styling | Tailwind CSS CDN + custom CSS | Responsive layout and liquid glass effects |
| Charts | Chart.js 4.4.x | Telemetry and diagnostic visualization |
| Backend | Python 3.11+, FastAPI, Uvicorn | REST and WebSocket services |
| Numerical computing | NumPy, SciPy | Thermal model and signal processing |
| ML | scikit-learn; optional PyTorch | Baselines and prognostics experiments |
| Persistence | SQLite; optional PostgreSQL | Telemetry, fault events and reports |
| Browser storage | IndexedDB | Offline/local fallback |
| Edge firmware | C++ with Arduino Core or ESP-IDF | ESP32 sensor acquisition |
| Device interface | Web Serial, UART, MQTT | Hardware data transport |

## Implementation Notes
- Pin dependency versions for reproducible builds.
- Do not use a CDN-only dependency strategy for an offline or operational deployment.
- Keep simulation logic separate from hardware adapters.
- Keep safety-critical firmware independent of browser UI state.
- Add authentication, origin restrictions and input validation before exposing the API beyond localhost.
