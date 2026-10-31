# KAVACH-BMS — Database Schema

The following SQLite-oriented schema is a starting point. Adapt types, constraints and indexes to the selected database engine.

## 1. Battery Pack Registry

```sql
CREATE TABLE battery_packs (
    pack_id TEXT PRIMARY KEY,
    serial_number TEXT UNIQUE NOT NULL,
    chemistry TEXT NOT NULL,
    nominal_voltage_v REAL NOT NULL,
    rated_capacity_ah REAL NOT NULL,
    deployment_unit TEXT,
    current_soh_pct REAL,
    lifecycle_status TEXT NOT NULL DEFAULT 'FIRST_LIFE_TACTICAL',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

## 2. Cell Telemetry

```sql
CREATE TABLE cell_telemetry_logs (
    log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pack_id TEXT NOT NULL REFERENCES battery_packs(pack_id),
    recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cell_index INTEGER NOT NULL CHECK (cell_index BETWEEN 1 AND 4),
    terminal_voltage_v REAL NOT NULL,
    current_a REAL NOT NULL,
    r_int_mohm REAL,
    temp_surface_c REAL,
    temp_core_estimated_c REAL,
    voc_ppm REAL,
    mosfet_bypassed INTEGER NOT NULL DEFAULT 0
);
```

## 3. Fault Events

```sql
CREATE TABLE fault_events (
    event_id TEXT PRIMARY KEY,
    pack_id TEXT NOT NULL REFERENCES battery_packs(pack_id),
    triggered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fault_type TEXT NOT NULL,
    affected_cell INTEGER,
    operating_mode TEXT NOT NULL,
    isolation_latency_ms REAL,
    bus_voltage_v REAL,
    mitigation_summary TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'SIMULATION'
);
```

## 4. Second-Life Assessment Reports

```sql
CREATE TABLE second_life_assessments (
    assessment_id TEXT PRIMARY KEY,
    pack_id TEXT NOT NULL REFERENCES battery_packs(pack_id),
    issued_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    retirement_soh_pct REAL NOT NULL,
    measured_capacity_wh REAL,
    derated_current_a REAL,
    projected_cycles INTEGER,
    target_application TEXT,
    assessment_hash TEXT,
    limitations TEXT NOT NULL
);
```

## 5. Indexes

```sql
CREATE INDEX idx_telemetry_pack_time
ON cell_telemetry_logs(pack_id, recorded_at DESC);

CREATE INDEX idx_faults_pack_time
ON fault_events(pack_id, triggered_at DESC);
```

## Data Integrity
- Store timestamps in UTC using a consistent ISO-8601 representation.
- Record telemetry source and model version.
- Preserve raw measurements separately from estimated values.
- Do not store a report as a certified battery passport unless a defined certification process exists.
