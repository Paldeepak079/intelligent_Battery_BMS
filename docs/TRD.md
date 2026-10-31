# KAVACH-BMS — Technical Requirements Document

## 1. Technical Scope
This document defines the prototype's software, estimation, telemetry and integration requirements. Numerical performance targets below are **design targets or demo values** until independently measured on the final hardware and dataset.

## 2. Core Technical Modules
- Cell telemetry acquisition and validation
- Two-node lumped thermal model
- 1D Kalman-filter-based core-temperature estimator
- Impedance and VOC diagnostic indicators
- ICA/DVA feature extraction
- SOH/RUL estimation interface
- Cold-weather charging simulation
- Second-life assessment and report generation
- CAN/telemetry anomaly detection

## 3. Thermal Model

Let the model state be:

\[
x_k = \begin{bmatrix}T_{core}(k)\\T_{surf}(k)\end{bmatrix}
\]

A two-node lumped thermal model may be expressed as:

\[
T_{core}(k+1)=T_{core}(k)+\frac{\Delta t}{C_{core}}
\left(Q_{gen}(k)-\frac{T_{core}(k)-T_{surf}(k)}{R_{c-s}}\right)
\]

\[
T_{surf}(k+1)=T_{surf}(k)+\frac{\Delta t}{C_{surf}}
\left(\frac{T_{core}(k)-T_{surf}(k)}{R_{c-s}}-\frac{T_{surf}(k)-T_{amb}}{R_{s-a}}\right)
\]

A simplified heat-generation term is:

\[
Q_{gen}=I^2R_{int}+IT_{core}\frac{\partial U_{ocv}}{\partial T}
\]

The implementation must document parameter units, sampling interval, parameter identification method and model limitations. The Kalman filter estimates the unmeasured core state using surface-temperature measurements and the model's state-transition and observation equations.

## 4. Electrochemical Diagnostics
- Calculate internal resistance from appropriately sampled current/voltage changes: \(R_{int}\approx\Delta V/\Delta I\).
- Derive Incremental Capacity Analysis (ICA): \(dQ/dV\).
- Derive Differential Voltage Analysis (DVA): \(dV/dQ\).
- Apply smoothing/denoising carefully; preserve peak positions and report preprocessing settings.
- Dataset provenance, cell identifiers, test conditions and train/test split must be recorded.

Candidate public datasets named in the project concept include NASA PCoE, Oxford and CALCE. Dataset use and any claimed benchmark must be traceable to the exact source and experimental protocol.

## 5. AI / Prognostics
The proposed model family is a hybrid 1D-CNN + TCN + LSTM/attention model, with gradient-boosted models as a comparison or fallback.

Required outputs:
- SOH estimate (%)
- RUL estimate (cycles or time, with unit stated)
- Confidence interval or uncertainty indicator
- Model version and inference timestamp
- Input-data quality status

Reported concept targets include 0.35 million parameters, 6.1 ms inference latency, 0.63 mJ/sample and SOH RMSE 0.021. These values must not be presented as verified results unless reproduced and measured on the declared target hardware and evaluation split.

## 6. Safety Diagnostic Stages
The interface may show three diagnostic stages:
1. **Impedance anomaly:** flag a significant resistance increase relative to a validated baseline.
2. **VOC/gas indicator:** flag a sensor reading above a configurable, sensor-specific threshold.
3. **Thermal indicator:** flag an estimated core temperature or rate-of-rise above validated limits.

The concept draft uses 150 ppm VOC and 65 °C core temperature as example thresholds. They are not universal safe limits. Thresholds must be selected for the actual cell chemistry, sensor, enclosure, calibration and test protocol. Gas sensing alone cannot establish that a cell is safe.

## 7. Cold-Weather Charging
The demo may model pulse warming before charge acceptance. Charging must remain inhibited unless validated cell-temperature, voltage and current conditions satisfy the selected cell manufacturer's limits. Do not implement a generic pulse profile as a real charger control law without cell-specific validation and independent protection.

## 8. Telemetry and Cybersecurity
- Validate schema, ranges, timestamps and message freshness.
- Reject malformed, replayed or out-of-order packets.
- Use authenticated transport for network-connected deployments.
- Apply anomaly detection (e.g., Z-score or Isolation Forest) as an advisory layer, not as the sole safety mechanism.
- Separate monitoring data from actuator commands.
- Log security events and preserve an auditable event trail.

## 9. Performance and Quality Targets
| Area | Prototype Target |
|---|---|
| UI rendering | Aim for 60 FPS on reference hardware |
| Telemetry display | 1–10 updates/second, depending on source |
| Fault-isolation demo | Illustrative target below 10 ms; verify on actual switching hardware |
| Model inference | Illustrative target 6.1 ms; benchmark on named hardware |
| Accessibility | WCAG 2.1 AA target, subject to audit |

## 10. Standards and Compliance Notes
- MIL-STD-810 is an environmental engineering and test framework; identify the applicable methods and tailored test procedures rather than claiming blanket compliance.
- CEMILAC-related airworthiness requirements must be determined with the relevant authority and platform context.
- ISO 15118-20 concerns EV-to-EVSE communication for energy transfer; it is not an internal battery-management protocol. Use it only if the project includes a relevant EV/EVSE interface. The official ISO scope is available at https://www.iso.org/standard/77845.html.
- No compliance or certification claim is made by this prototype.
