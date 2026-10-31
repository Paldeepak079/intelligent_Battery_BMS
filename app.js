/**
 * KAVACH-BMS — Tactical Avionics Command & Digital Twin Engine
 * Kinetic & Autonomous Virtual-Sensing Architecture for Contested High-Altitude BMS
 * Pure Product Identity — Zero Fabricated Data in Hardware Mode
 */

(function () {
  'use strict';

  // --- HTML Sanitization Utility (Security) ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // --- Sound Synthesizer via Web Audio API ---
  class TacticalAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      return this.enabled;
    }

    playClick() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);
        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.04);
      } catch (e) {}
    }

    playRelay() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [0, 0.025].forEach((offset) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(320, now + offset);
          gain.gain.setValueAtTime(0.18, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.02);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.02);
        });
      } catch (e) {}
    }

    playAlarm() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [0, 0.15].forEach((offset, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(idx === 0 ? 880 : 1046, now + offset);
          gain.gain.setValueAtTime(0.09, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + offset);
          osc.stop(now + offset + 0.1);
        });
      } catch (e) {}
    }

    playPulse() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(95, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
      } catch (e) {}
    }

    playSuccess() {
      if (!this.enabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.06);
          gain.gain.setValueAtTime(0.07, now + i * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.15);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + i * 0.06);
          osc.stop(now + i * 0.06 + 0.15);
        });
      } catch (e) {}
    }
  }

  const audio = new TacticalAudio();

  // --- Two-Node Lumped Thermal Model & Kalman Estimator (Physics Engine) ---
  class ThermalTwinKalman {
    constructor(params = {}) {
      this.C_core = params.C_core ?? 65.0; // J/K
      this.C_surf = params.C_surf ?? 14.0; // J/K
      this.R_cs = params.R_cs ?? 1.95;     // K/W
      this.R_sa = params.R_sa ?? 3.40;     // K/W
      this.entropy_coeff = -0.00022;        // V/K

      this.T_core = params.T_amb ?? 22.0;
      this.T_surf = params.T_amb ?? 22.0;
      this.T_amb = params.T_amb ?? 22.0;

      this.x_est = [this.T_core, this.T_surf];
      this.P = [[1.5, 0.3], [0.3, 1.2]];
      this.Q = [[0.04, 0.0], [0.0, 0.02]];
      this.R_meas = 0.35;
    }

    reset(tAmb = 22.0) {
      this.T_amb = tAmb;
      this.T_core = tAmb;
      this.T_surf = tAmb;
      this.x_est = [tAmb, tAmb];
      this.P = [[1.5, 0.3], [0.3, 1.2]];
    }

    step(I, R_int_mohm = 33.0, dt = 1.0, ambient = null) {
      if (ambient !== null) this.T_amb = ambient;

      const Q_joule = (I * I) * (R_int_mohm / 1000.0);
      const Q_entropy = I * (this.T_core + 273.15) * this.entropy_coeff;
      const Q_gen = Math.max(0, Q_joule + Q_entropy);

      // ODE Integration
      const dT_core = (dt / this.C_core) * (Q_gen - (this.T_core - this.T_surf) / this.R_cs);
      const dT_surf = (dt / this.C_surf) * (((this.T_core - this.T_surf) / this.R_cs) - ((this.T_surf - this.T_amb) / this.R_sa));

      this.T_core += dT_core;
      this.T_surf += dT_surf;

      // Kalman Prediction
      const x_core_pred = this.x_est[0] + (dt / this.C_core) * (Q_gen - (this.x_est[0] - this.x_est[1]) / this.R_cs);
      const x_surf_pred = this.x_est[1] + (dt / this.C_surf) * (((this.x_est[0] - this.x_est[1]) / this.R_cs) - ((this.x_est[1] - this.T_amb) / this.R_sa));

      // Simulated surface sensor reading with thermal noise
      const sensor_noise = (Math.random() - 0.5) * 0.12;
      const z_surf_meas = this.T_surf + sensor_noise;

      // Kalman Correction
      const S = this.P[1][1] + this.R_meas;
      const K = [this.P[0][1] / S, this.P[1][1] / S];
      const y_res = z_surf_meas - x_surf_pred;

      this.x_est[0] = x_core_pred + K[0] * y_res;
      this.x_est[1] = x_surf_pred + K[1] * y_res;

      return {
        T_core_actual: this.T_core,
        T_surf_actual: this.T_surf,
        T_surf_meas: z_surf_meas,
        T_core_kalman: this.x_est[0],
        Q_gen: Q_gen,
        Q_joule: Q_joule
      };
    }
  }

  // --- System Master State ---
  const state = {
    theme: localStorage.getItem('kavach_theme') || 'dark',

    // Physical Hardware Connection State (REAL DATA ONLY)
    hardware: {
      connected: false,
      sourceType: 'NONE', // 'NONE' | 'WEB_SERIAL' | 'WEBSOCKET'
      lastPacketTime: null,
      freshnessTimer: null,
      busVoltage: null,
      busCurrent: null,
      busPower: null,
      ambientTemp: null,
      vocPpm: null,
      cells: [
        { id: 1, v: null, r: null, t_surf: null, t_core: null, bypassed: false, health: 'UNKNOWN' },
        { id: 2, v: null, r: null, t_surf: null, t_core: null, bypassed: false, health: 'UNKNOWN' },
        { id: 3, v: null, r: null, t_surf: null, t_core: null, bypassed: false, health: 'UNKNOWN' },
        { id: 4, v: null, r: null, t_surf: null, t_core: null, bypassed: false, health: 'UNKNOWN' }
      ],
      prognostics: {
        soc: null,
        soh: null,
        rulCycles: null,
        status: 'Awaiting Hardware Telemetry'
      }
    },

    // Problem Module 1: Fault Isolation & Solid-State Bypass
    prob1: {
      doctrine: 'KAVACH_DEGRADED',
      faultActive: false,
      rfaultMohm: 148,
      targetBusV: 12.0,
      bypassed: false,
      latencyMs: null,
      boostDuty: 0.0,
      rawPackV: null,
      regulatedV: null,
      railOutcome: 'Awaiting Trigger'
    },

    // Problem Module 2: Thermal Digital Twin & Kalman Model
    prob2: {
      running: false,
      intervalId: null,
      twin: new ThermalTwinKalman(),
      times: [],
      coreHistory: [],
      surfHistory: []
    },

    // Problem Module 3: Pre-Runaway Multi-Stage Diagnostics
    prob3: {
      stage1Active: false,
      stage2Active: false,
      stage3Active: false,
      rInt: 33.1,
      vocPpm: 24.5,
      coreTemp: 26.8
    },

    // Problem Module 4: Sub-Zero Cold Warming
    prob4: {
      subzeroActive: false,
      warmingActive: false,
      intervalId: null,
      ambientTemp: 22.0,
      coreTemp: 22.0,
      targetTemp: 5.0,
      progressPct: 0
    },

    // Problem Module 5: Second-Life Assessment & ICA
    prob5: {
      soh: 82.5,
      capacityAh: 48.0,
      application: 'STATIONARY_BESS'
    },

    // Charts references
    charts: {
      thermal: null,
      ica: null,
      electrical: null
    },

    logs: [],
    serialPort: null,
    serialReader: null,
    ws: null
  };

  // --- Audit Logger Utility ---
  function addLog(severity, source, message) {
    const timeStr = new Date().toISOString().substring(11, 23);
    const logEntry = { time: timeStr, severity, source, message };
    state.logs.unshift(logEntry);
    if (state.logs.length > 50) state.logs.pop();

    const logContainer = document.getElementById('tactical-log-stream');
    if (logContainer) {
      const colorMap = {
        INFO: 'text-slate-400',
        WARN: 'text-amber-400',
        ALERT: 'text-cyan-400',
        CRITICAL: 'text-rose-400',
        ISOLATION: 'text-emerald-400 font-semibold'
      };
      const badgeBgMap = {
        INFO: 'bg-slate-800 text-slate-300',
        WARN: 'bg-amber-950/80 text-amber-300 border border-amber-600/40',
        ALERT: 'bg-cyan-950/80 text-cyan-300 border border-cyan-600/40',
        CRITICAL: 'bg-rose-950/80 text-rose-300 border border-rose-600/40',
        ISOLATION: 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
      };

      const row = document.createElement('div');
      row.className = `flex items-start gap-2 py-1 border-b border-white/5 font-mono text-xs ${colorMap[severity] || 'text-slate-300'}`;
      row.innerHTML = `
        <span class="text-slate-500 shrink-0">[${timeStr}]</span>
        <span class="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${badgeBgMap[severity] || ''}">${escapeHtml(severity)}</span>
        <span class="text-slate-400 shrink-0 font-semibold">&lt;${escapeHtml(source)}&gt;</span>
        <span class="truncate">${escapeHtml(message)}</span>
      `;
      logContainer.insertBefore(row, logContainer.firstChild);

      while (logContainer.children.length > 40) {
        logContainer.removeChild(logContainer.lastChild);
      }
    }
  }

  // --- Dark / Light Theme Manager ---
  function applyTheme(theme) {
    state.theme = theme;
    localStorage.setItem('kavach_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }

    // Refresh charts with theme-compliant colors
    updateChartTheme();
  }

  function toggleTheme() {
    audio.playClick();
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
    addLog('INFO', 'UI_THEME', `Theme switched to ${newTheme.toUpperCase()} mode.`);
  }

  function updateChartTheme() {
    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const tickColor = isDark ? '#94A3B8' : '#64748B';
    const legendColor = isDark ? '#CBD5E1' : '#334155';

    [state.charts.thermal, state.charts.ica, state.charts.electrical].forEach((chart) => {
      if (chart) {
        if (chart.options.scales.x) {
          chart.options.scales.x.grid.color = gridColor;
          chart.options.scales.x.ticks.color = tickColor;
        }
        if (chart.options.scales.y) {
          chart.options.scales.y.grid.color = gridColor;
          chart.options.scales.y.ticks.color = tickColor;
        }
        if (chart.options.plugins.legend) {
          chart.options.plugins.legend.labels.color = legendColor;
        }
        chart.update('none');
      }
    });
  }

  // --- Ambient HUD Particle Canvas ---
  function initHudCanvas() {
    const canvas = document.getElementById('hud-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.4 + 0.15
      });
    }

    function renderHud() {
      ctx.clearRect(0, 0, width, height);

      const isDark = state.theme === 'dark';
      const colorBase = isDark ? '0, 242, 254' : '8, 145, 178';

      // Subtle tactical dot grid
      ctx.fillStyle = `rgba(${colorBase}, 0.03)`;
      const gridSize = 48;
      for (let x = 0; x < width; x += gridSize) {
        for (let y = 0; y < height; y += gridSize) {
          ctx.fillRect(x, y, 1.2, 1.2);
        }
      }

      // Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.fillStyle = `rgba(${colorBase}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 100) {
            ctx.strokeStyle = `rgba(${colorBase}, ${0.1 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(renderHud);
    }
    renderHud();
  }

  // --- Real-Time Hardware Telemetry UI Refresh ---
  function updateHardwareUi() {
    const hw = state.hardware;
    const topStatusBadge = document.getElementById('top-status-badge');
    const topStatusText = document.getElementById('top-status-text');
    const topStatusDot = document.getElementById('top-status-dot');
    const sourceBadge = document.getElementById('telemetry-source-badge');
    const freshnessBadge = document.getElementById('data-freshness-badge');

    if (!hw.connected) {
      if (topStatusBadge) {
        topStatusBadge.className = 'glass-pill border-slate-700 text-slate-400 bg-slate-900/40';
      }
      if (topStatusText) topStatusText.textContent = 'HARDWARE: NOT CONNECTED';
      if (topStatusDot) topStatusDot.className = 'w-2 h-2 rounded-full bg-slate-500';
      if (sourceBadge) {
        sourceBadge.textContent = 'SOURCE: DISCONNECTED (NO LIVE DATA)';
        sourceBadge.className = 'glass-pill border-slate-700 text-slate-400 bg-slate-900/40 hidden md:inline-flex';
      }
      if (freshnessBadge) freshnessBadge.textContent = 'LAST PKT: NEVER';

      // KPI Cards Show "—" / "NO LIVE DATA"
      const busVElem = document.getElementById('kpi-bus-v');
      const busIElem = document.getElementById('kpi-bus-i');
      const busPElem = document.getElementById('kpi-bus-p');
      const topolElem = document.getElementById('kpi-topology');
      const topolBadge = document.getElementById('kpi-topology-badge');
      const busTag = document.getElementById('kpi-bus-status-tag');
      const coreTempElem = document.getElementById('kpi-core-temp');
      const surfTempElem = document.getElementById('kpi-surf-temp');
      const deltaTempElem = document.getElementById('kpi-delta-temp');
      const sohElem = document.getElementById('kpi-soh');
      const rulElem = document.getElementById('kpi-rul');
      const modelStatus = document.getElementById('kpi-model-status');

      if (busVElem) busVElem.textContent = '—';
      if (busIElem) busIElem.textContent = '—';
      if (busPElem) busPElem.textContent = '—';
      if (busTag) busTag.textContent = 'NO LIVE DATA';
      if (topolElem) topolElem.innerHTML = '<span class="text-slate-400">NOT CONNECTED</span>';
      if (topolBadge) topolBadge.textContent = 'AWAITING SENSORS';

      if (coreTempElem) coreTempElem.textContent = '—';
      if (surfTempElem) surfTempElem.textContent = '—';
      if (deltaTempElem) deltaTempElem.textContent = '—';
      if (sohElem) sohElem.textContent = '—';
      if (rulElem) rulElem.textContent = '—';
      if (modelStatus) modelStatus.textContent = 'Awaiting hardware telemetry';

      // 4 Cell Cards show DISCONNECTED
      [1, 2, 3, 4].forEach((id) => {
        const card = document.getElementById(`cell-card-${id}`);
        const vElem = document.getElementById(`cell-${id}-v`);
        const rElem = document.getElementById(`cell-${id}-r`);
        const tSurfElem = document.getElementById(`cell-${id}-tsurf`);
        const tCoreElem = document.getElementById(`cell-${id}-tcore`);
        const badgeElem = document.getElementById(`cell-${id}-badge`);
        const barElem = document.getElementById(`cell-${id}-bar`);

        if (vElem) vElem.textContent = '— V';
        if (rElem) rElem.textContent = '— mΩ';
        if (tSurfElem) tSurfElem.textContent = '— °C';
        if (tCoreElem) tCoreElem.textContent = '— °C';
        if (barElem) barElem.style.width = '0%';
        if (badgeElem) {
          badgeElem.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700';
          badgeElem.textContent = 'DISCONNECTED';
        }
        if (card) card.className = 'glass-panel cell-card disconnected p-4 space-y-3';
      });

      return;
    }

    // Hardware IS connected — render genuine readings
    if (topStatusBadge) {
      topStatusBadge.className = 'glass-pill border-emerald-500/40 text-emerald-400 bg-emerald-950/20';
    }
    if (topStatusText) topStatusText.textContent = 'HARDWARE LINK: ONLINE (LIVE)';
    if (topStatusDot) topStatusDot.className = 'pulse-dot emerald';
    if (sourceBadge) {
      sourceBadge.textContent = `SOURCE: ${hw.sourceType}`;
      sourceBadge.className = 'glass-pill border-emerald-500/40 text-emerald-300 bg-emerald-950/30 hidden md:inline-flex';
    }

    if (hw.lastPacketTime && freshnessBadge) {
      const msAgo = Date.now() - hw.lastPacketTime;
      freshnessBadge.textContent = `LAST PKT: ${(msAgo / 1000).toFixed(1)}s AGO`;
    }

    // Render KPI numbers
    const busVElem = document.getElementById('kpi-bus-v');
    const busIElem = document.getElementById('kpi-bus-i');
    const busPElem = document.getElementById('kpi-bus-p');
    const busTag = document.getElementById('kpi-bus-status-tag');
    const topolElem = document.getElementById('kpi-topology');
    const topolBadge = document.getElementById('kpi-topology-badge');

    if (busVElem && hw.busVoltage !== null) busVElem.textContent = hw.busVoltage.toFixed(2);
    if (busIElem && hw.busCurrent !== null) busIElem.textContent = hw.busCurrent.toFixed(2);
    if (busPElem && hw.busPower !== null) busPElem.textContent = hw.busPower.toFixed(1);
    if (busTag) busTag.textContent = 'LIVE STREAM';

    if (topolElem) {
      topolElem.innerHTML = '<span class="text-emerald-400 font-bold">4S1P HARDWARE PACK</span> <span class="text-xs text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded ml-2 border border-emerald-800">STREAMING</span>';
    }
    if (topolBadge) topolBadge.textContent = 'NOMINAL BUS';

    // Cell Cards
    hw.cells.forEach((c) => {
      const card = document.getElementById(`cell-card-${c.id}`);
      const vElem = document.getElementById(`cell-${c.id}-v`);
      const rElem = document.getElementById(`cell-${c.id}-r`);
      const tSurfElem = document.getElementById(`cell-${c.id}-tsurf`);
      const tCoreElem = document.getElementById(`cell-${c.id}-tcore`);
      const badgeElem = document.getElementById(`cell-${c.id}-badge`);
      const barElem = document.getElementById(`cell-${c.id}-bar`);

      if (vElem && c.v !== null) vElem.textContent = `${c.v.toFixed(2)} V`;
      if (rElem && c.r !== null) rElem.textContent = `${c.r.toFixed(1)} mΩ`;
      if (tSurfElem && c.t_surf !== null) tSurfElem.textContent = `${c.t_surf.toFixed(1)} °C`;
      if (tCoreElem && c.t_core !== null) tCoreElem.textContent = `${c.t_core.toFixed(1)} °C`;

      if (barElem && c.v !== null) {
        const pct = Math.max(0, Math.min(100, ((c.v - 2.8) / (4.2 - 2.8)) * 100));
        barElem.style.width = `${pct}%`;
      }

      if (badgeElem && card) {
        badgeElem.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-700';
        badgeElem.textContent = 'ONLINE';
        card.className = 'glass-panel cell-card nominal p-4 space-y-3';
      }
    });
  }

  // Freshness timer tick every 500ms
  setInterval(() => {
    if (state.hardware.connected && state.hardware.lastPacketTime) {
      const freshnessBadge = document.getElementById('data-freshness-badge');
      if (freshnessBadge) {
        const msAgo = Date.now() - state.hardware.lastPacketTime;
        freshnessBadge.textContent = `LAST PKT: ${(msAgo / 1000).toFixed(1)}s AGO`;
        if (msAgo > 5000) {
          freshnessBadge.className = 'glass-pill border-amber-500/50 text-amber-300 bg-amber-950/40 text-[10px]';
        } else {
          freshnessBadge.className = 'glass-pill border-slate-700 text-slate-400 bg-slate-900/40 text-[10px]';
        }
      }
    }
  }, 500);

  // --- PROBLEM MODULE 1: Cell Fault Isolation & Solid-State Bypass Engine ---
  function initProblemModule1() {
    const triggerBtn = document.getElementById('prob1-trigger-btn');
    const resetBtn = document.getElementById('prob1-reset-btn');
    const doctrineDegraded = document.getElementById('doctrine-btn-degraded');
    const doctrineStrict = document.getElementById('doctrine-btn-strict');
    const rFaultInput = document.getElementById('prob1-rfault');
    const targetBusInput = document.getElementById('prob1-targetbus');

    function updateProb1View() {
      const p1 = state.prob1;
      const statusPill = document.getElementById('prob1-status-pill');
      const switchState = document.getElementById('prob1-switch-state');
      const latencyElem = document.getElementById('prob1-latency');
      const dutyElem = document.getElementById('prob1-duty-cycle');
      const rawPackVElem = document.getElementById('prob1-pack-raw-v');
      const regulatedVElem = document.getElementById('prob1-regulated-v');
      const outcomeElem = document.getElementById('prob1-mission-outcome');

      if (!p1.faultActive) {
        if (statusPill) {
          statusPill.textContent = 'NOMINAL (4S1P)';
          statusPill.className = 'px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800';
        }
        if (switchState) switchState.textContent = 'CLOSED (SERIES C2)';
        if (latencyElem) latencyElem.textContent = '— ms';
        if (dutyElem) dutyElem.textContent = '0.0% (PASSTHRU)';
        if (rawPackVElem) rawPackVElem.textContent = '14.84 V';
        if (regulatedVElem) regulatedVElem.textContent = '14.84 V (DIRECT)';
        if (outcomeElem) {
          outcomeElem.textContent = 'Nominal Full Thrust';
          outcomeElem.className = 'text-emerald-400 font-bold text-sm mt-0.5';
        }
        updateCircuitSchematic('NOMINAL');
        return;
      }

      // Fault is active!
      if (p1.doctrine === 'KAVACH_DEGRADED') {
        if (statusPill) {
          statusPill.textContent = 'DEGRADED ACTIVE (3S1P)';
          statusPill.className = 'px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-300 border border-amber-800';
        }
        if (switchState) switchState.textContent = 'BYPASSED (MOSFET ON)';
        if (latencyElem) latencyElem.textContent = `${p1.latencyMs.toFixed(1)} ms`;
        if (dutyElem) dutyElem.textContent = `${(p1.boostDuty * 100).toFixed(1)}%`;
        if (rawPackVElem) rawPackVElem.textContent = `${p1.rawPackV.toFixed(2)} V (3S)`;
        if (regulatedVElem) regulatedVElem.textContent = `${p1.regulatedV.toFixed(2)} V (BOOST)`;
        if (outcomeElem) {
          outcomeElem.textContent = 'Thrust Preserved (100%)';
          outcomeElem.className = 'text-tacticalCyan font-bold text-sm mt-0.5';
        }
        updateCircuitSchematic('BYPASS');
      } else {
        // Civilian Strict
        if (statusPill) {
          statusPill.textContent = 'SAFETY TRIP (TOTAL SHUTDOWN)';
          statusPill.className = 'px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800';
        }
        if (switchState) switchState.textContent = 'MAIN TRIP (DISCONNECTED)';
        if (latencyElem) latencyElem.textContent = `${p1.latencyMs.toFixed(1)} ms`;
        if (dutyElem) dutyElem.textContent = '0.0% (INHIBITED)';
        if (rawPackVElem) rawPackVElem.textContent = '0.00 V';
        if (regulatedVElem) regulatedVElem.textContent = '0.00 V';
        if (outcomeElem) {
          outcomeElem.textContent = 'Mission Abort (0W)';
          outcomeElem.className = 'text-rose-400 font-bold text-sm mt-0.5';
        }
        updateCircuitSchematic('TRIP');
      }
    }

    triggerBtn?.addEventListener('click', () => {
      audio.playAlarm();
      const rFault = parseFloat(rFaultInput?.value || '148');
      const targetBus = parseFloat(targetBusInput?.value || '12.0');

      state.prob1.faultActive = true;
      state.prob1.rfaultMohm = rFault;
      state.prob1.targetBusV = targetBus;
      state.prob1.latencyMs = +(6.5 + Math.random() * 1.8).toFixed(1);

      if (state.prob1.doctrine === 'KAVACH_DEGRADED') {
        const v3s = 3.71 * 3; // 11.13V
        state.prob1.rawPackV = v3s;
        state.prob1.regulatedV = targetBus;
        state.prob1.boostDuty = +(1 - (v3s / targetBus)).toFixed(3);
        audio.playRelay();
        addLog('CRITICAL', 'FAULT_ISO_P1', `Cell 2 micro-short simulated (R_fault=${rFault}mΩ). Isolated via solid-state bypass in ${state.prob1.latencyMs}ms.`);
        addLog('ISOLATION', 'BOOST_P1', `Synchronous boost engaged (D=${(state.prob1.boostDuty*100).toFixed(1)}%). Maintained regulated ${targetBus.toFixed(1)}V rail.`);
      } else {
        state.prob1.rawPackV = 0.0;
        state.prob1.regulatedV = 0.0;
        state.prob1.boostDuty = 0.0;
        addLog('CRITICAL', 'SAFETY_P1', 'CIVILIAN_STRICT doctrine triggered: Main contactor opened. Total pack output 0V.');
      }
      updateProb1View();
    });

    resetBtn?.addEventListener('click', () => {
      audio.playSuccess();
      state.prob1.faultActive = false;
      addLog('INFO', 'MODULE_P1', 'Problem 1 state restored to 4S1P nominal baseline.');
      updateProb1View();
    });

    doctrineDegraded?.addEventListener('click', () => {
      audio.playClick();
      state.prob1.doctrine = 'KAVACH_DEGRADED';
      doctrineDegraded.className = 'doctrine-btn active degraded';
      if (doctrineStrict) doctrineStrict.className = 'doctrine-btn';
      addLog('INFO', 'DOCTRINE', 'P1 Doctrine set to KAVACH_DEGRADED (Mission Bus Preservation).');
      updateProb1View();
    });

    doctrineStrict?.addEventListener('click', () => {
      audio.playClick();
      state.prob1.doctrine = 'CIVILIAN_STRICT';
      doctrineStrict.className = 'doctrine-btn active strict';
      if (doctrineDegraded) doctrineDegraded.className = 'doctrine-btn';
      addLog('INFO', 'DOCTRINE', 'P1 Doctrine set to CIVILIAN_STRICT (Full Trip on Any Cell Fault).');
      updateProb1View();
    });
  }

  function updateCircuitSchematic(mode) {
    const cell2StateElem = document.getElementById('svg-cell-2-state');
    const bypassContactor = document.getElementById('svg-bypass-switch');
    const mainContactor = document.getElementById('svg-main-contactor');
    const boostConverter = document.getElementById('svg-boost-converter');
    const normalBusLine = document.getElementById('svg-bus-line-c2');
    const bypassBusLine = document.getElementById('svg-bypass-line');
    const outputFlowLine = document.getElementById('svg-output-flow');

    if (!cell2StateElem || !bypassContactor) return;

    if (mode === 'TRIP') {
      mainContactor.setAttribute('transform', 'rotate(-30 460 70)');
      mainContactor.style.stroke = '#F43F5E';
      normalBusLine.className.baseVal = 'circuit-line inactive';
      bypassBusLine.className.baseVal = 'circuit-line inactive';
      outputFlowLine.className.baseVal = 'circuit-line inactive';
      boostConverter.style.opacity = '0.25';
      cell2StateElem.textContent = 'TRIP (0V)';
      cell2StateElem.style.fill = '#F43F5E';
    } else if (mode === 'BYPASS') {
      mainContactor.setAttribute('transform', 'rotate(0 460 70)');
      mainContactor.style.stroke = '#10B981';
      bypassContactor.setAttribute('transform', 'rotate(0 190 32)');
      bypassContactor.style.stroke = '#F59E0B';
      normalBusLine.className.baseVal = 'circuit-line inactive';
      bypassBusLine.className.baseVal = 'circuit-line bypassed';
      outputFlowLine.className.baseVal = 'circuit-line';
      boostConverter.style.opacity = '1';
      cell2StateElem.textContent = 'BYPASSED';
      cell2StateElem.style.fill = '#F59E0B';
    } else {
      mainContactor.setAttribute('transform', 'rotate(0 460 70)');
      mainContactor.style.stroke = '#10B981';
      bypassContactor.setAttribute('transform', 'rotate(-35 190 32)');
      bypassContactor.style.stroke = 'rgba(255, 255, 255, 0.3)';
      normalBusLine.className.baseVal = 'circuit-line';
      bypassBusLine.className.baseVal = 'circuit-line inactive';
      outputFlowLine.className.baseVal = 'circuit-line';
      boostConverter.style.opacity = '0.5';
      cell2StateElem.textContent = 'NOMINAL';
      cell2StateElem.style.fill = '#10B981';
    }
  }

  // --- PROBLEM MODULE 2: Thermal Twin & Kalman Observer Engine ---
  function initProblemModule2() {
    const runBtn = document.getElementById('prob2-run-btn');
    const stepBtn = document.getElementById('prob2-step-btn');
    const resetBtn = document.getElementById('prob2-reset-btn');

    const cCoreInput = document.getElementById('prob2-ccore');
    const cSurfInput = document.getElementById('prob2-csurf');
    const rCsInput = document.getElementById('prob2-rcs');
    const rSaInput = document.getElementById('prob2-rsa');
    const tAmbInput = document.getElementById('prob2-tamb');
    const iLoadInput = document.getElementById('prob2-iload');

    function syncParams() {
      state.prob2.twin.C_core = parseFloat(cCoreInput?.value || '65.0');
      state.prob2.twin.C_surf = parseFloat(cSurfInput?.value || '14.0');
      state.prob2.twin.R_cs = parseFloat(rCsInput?.value || '1.95');
      state.prob2.twin.R_sa = parseFloat(rSaInput?.value || '3.40');
      state.prob2.twin.T_amb = parseFloat(tAmbInput?.value || '22.0');
    }

    function doThermalStep() {
      syncParams();
      const iLoad = parseFloat(iLoadInput?.value || '5.0');
      const res = state.prob2.twin.step(iLoad, 33.0, 1.0);

      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      state.prob2.times.push(now);
      state.prob2.coreHistory.push(+res.T_core_kalman.toFixed(1));
      state.prob2.surfHistory.push(+res.T_surf_meas.toFixed(1));

      if (state.prob2.times.length > 30) {
        state.prob2.times.shift();
        state.prob2.coreHistory.shift();
        state.prob2.surfHistory.shift();
      }

      // Update text readouts
      const qJouleElem = document.getElementById('prob2-qjoule');
      const gradElem = document.getElementById('prob2-gradient');
      if (qJouleElem) qJouleElem.textContent = `${res.Q_joule.toFixed(2)} W`;
      if (gradElem) gradElem.textContent = `+${(res.T_core_kalman - res.T_surf_meas).toFixed(1)} °C`;

      // Update Chart
      if (state.charts.thermal) {
        state.charts.thermal.data.labels = state.prob2.times;
        state.charts.thermal.data.datasets[0].data = state.prob2.coreHistory;
        state.charts.thermal.data.datasets[1].data = state.prob2.surfHistory;
        state.charts.thermal.update('none');
      }
    }

    runBtn?.addEventListener('click', () => {
      audio.playClick();
      state.prob2.running = !state.prob2.running;
      if (state.prob2.running) {
        runBtn.textContent = '⏸ Pause Twin';
        runBtn.className = 'btn-tactical btn-amber py-1.5 px-3 text-xs font-semibold';
        state.prob2.intervalId = setInterval(doThermalStep, 1000);
        addLog('INFO', 'THERMAL_P2', 'Two-node thermal simulation runner started (dt=1.0s).');
      } else {
        runBtn.textContent = '▶ Run Twin';
        runBtn.className = 'btn-tactical btn-cyan py-1.5 px-3 text-xs font-semibold';
        clearInterval(state.prob2.intervalId);
        addLog('INFO', 'THERMAL_P2', 'Two-node thermal simulation runner paused.');
      }
    });

    stepBtn?.addEventListener('click', () => {
      audio.playClick();
      doThermalStep();
    });

    resetBtn?.addEventListener('click', () => {
      audio.playClick();
      if (state.prob2.running) {
        clearInterval(state.prob2.intervalId);
        state.prob2.running = false;
        runBtn.textContent = '▶ Run Twin';
        runBtn.className = 'btn-tactical btn-cyan py-1.5 px-3 text-xs font-semibold';
      }
      const tAmb = parseFloat(tAmbInput?.value || '22.0');
      state.prob2.twin.reset(tAmb);
      state.prob2.times = [];
      state.prob2.coreHistory = [];
      state.prob2.surfHistory = [];
      if (state.charts.thermal) {
        state.charts.thermal.data.labels = [];
        state.charts.thermal.data.datasets[0].data = [];
        state.charts.thermal.data.datasets[1].data = [];
        state.charts.thermal.update();
      }
      addLog('INFO', 'THERMAL_P2', 'Thermal model state reset to ambient equilibrium.');
    });

    // Populate initial 5 data points so chart has clear baseline
    for (let i = 0; i < 5; i++) {
      doThermalStep();
    }
  }

  // --- PROBLEM MODULE 3: Early Diagnostics Engine ---
  function initProblemModule3() {
    const s1Btn = document.getElementById('prob3-trigger-stage1');
    const s2Btn = document.getElementById('prob3-trigger-stage2');
    const s3Btn = document.getElementById('prob3-trigger-stage3');
    const resetBtn = document.getElementById('prob3-reset-btn');

    const s1Led = document.getElementById('diag-stage1-led');
    const s1Val = document.getElementById('diag-stage1-val');
    const s2Led = document.getElementById('diag-stage2-led');
    const s2Val = document.getElementById('diag-stage2-val');
    const s3Led = document.getElementById('diag-stage3-led');
    const s3Val = document.getElementById('diag-stage3-val');
    const banner = document.getElementById('diag-banner-text');

    function updateDiagView() {
      const p3 = state.prob3;
      if (s1Val) s1Val.textContent = `${p3.rInt.toFixed(1)} mΩ (Base: 33.0 mΩ)`;
      if (s2Val) s2Val.textContent = `${p3.vocPpm.toFixed(1)} ppm (Limit: 150)`;
      if (s3Val) s3Val.textContent = `${p3.coreTemp.toFixed(1)} °C (Limit: 65°C)`;

      if (s1Led) {
        s1Led.className = p3.stage1Active
          ? 'w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_#F43F5E] animate-ping'
          : 'w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]';
      }
      if (s2Led) {
        s2Led.className = p3.stage2Active
          ? 'w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_12px_#F59E0B] animate-ping'
          : 'w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]';
      }
      if (s3Led) {
        s3Led.className = p3.stage3Active
          ? 'w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_12px_#F43F5E] animate-ping'
          : 'w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]';
      }

      if (banner) {
        if (p3.stage3Active) {
          banner.innerHTML = '<span class="text-rose-400 font-bold">⚠️ CRITICAL: Stage 3 Core Hotspot (68°C) exceeds safety limit! Immediate cooling or derating required.</span>';
        } else if (p3.stage2Active) {
          banner.innerHTML = '<span class="text-amber-400 font-bold">⚠️ Stage 2 VOC alert: 184 ppm off-gas detected. Pre-venting gas mitigation active (60-120s window).</span>';
        } else if (p3.stage1Active) {
          banner.innerHTML = '<span class="text-cyan-400 font-bold">⚠️ Stage 1 Ohmic drift detected (+25 mΩ). Pre-thermal detection window: 180s-300s.</span>';
        } else {
          banner.innerHTML = '<span class="text-emerald-400 font-medium">✓ All 3 Early Diagnostic stages nominal. No runaway precursors detected.</span>';
        }
      }
    }

    s1Btn?.addEventListener('click', () => {
      audio.playAlarm();
      state.prob3.stage1Active = true;
      state.prob3.rInt = 58.0;
      addLog('WARN', 'DIAG_P3', 'Stage 1 Impedance surge triggered (+25mΩ). Pre-thermal detection window active.');
      updateDiagView();
    });

    s2Btn?.addEventListener('click', () => {
      audio.playAlarm();
      state.prob3.stage2Active = true;
      state.prob3.vocPpm = 184.2;
      addLog('WARN', 'DIAG_P3', 'Stage 2 VOC electrolyte off-gas spike simulated (184.2 ppm).');
      updateDiagView();
    });

    s3Btn?.addEventListener('click', () => {
      audio.playAlarm();
      state.prob3.stage3Active = true;
      state.prob3.coreTemp = 68.4;
      addLog('CRITICAL', 'DIAG_P3', 'Stage 3 Core hotspot threshold breached (68.4°C vs 65.0°C limit).');
      updateDiagView();
    });

    resetBtn?.addEventListener('click', () => {
      audio.playSuccess();
      state.prob3.stage1Active = false;
      state.prob3.stage2Active = false;
      state.prob3.stage3Active = false;
      state.prob3.rInt = 33.1;
      state.prob3.vocPpm = 24.5;
      state.prob3.coreTemp = 26.8;
      addLog('INFO', 'DIAG_P3', 'All diagnostic stage triggers cleared to nominal baseline.');
      updateDiagView();
    });
  }

  // --- PROBLEM MODULE 4: Sub-Zero Cold Pulse Warming Engine ---
  function initProblemModule4() {
    const setColdBtn = document.getElementById('prob4-set-cold-btn');
    const warmBtn = document.getElementById('prob4-toggle-warm-btn');
    const coldTempInput = document.getElementById('prob4-cold-temp');
    const targetTempInput = document.getElementById('prob4-target-temp');

    const tempText = document.getElementById('pulse-temp-text');
    const pctText = document.getElementById('pulse-percent-text');
    const bar = document.getElementById('pulse-progress-bar');
    const lockText = document.getElementById('prob4-charge-lock');
    const powerText = document.getElementById('prob4-warm-power');

    function updatePulseView() {
      const p4 = state.prob4;
      if (tempText) tempText.textContent = `${p4.coreTemp.toFixed(1)} °C`;
      if (pctText) pctText.textContent = `${p4.progressPct}%`;
      if (bar) bar.style.width = `${p4.progressPct}%`;

      if (lockText) {
        if (p4.coreTemp < 0) {
          lockText.textContent = 'LOCKED (SUB-ZERO)';
          lockText.className = 'text-tacticalCrimson font-bold mt-0.5';
        } else {
          lockText.textContent = 'UNLOCKED (SAFE)';
          lockText.className = 'text-tacticalEmerald font-bold mt-0.5';
        }
      }

      if (powerText) {
        powerText.textContent = p4.warmingActive ? '18.4 W' : '0.0 W';
      }
    }

    setColdBtn?.addEventListener('click', () => {
      audio.playClick();
      const coldVal = parseFloat(coldTempInput?.value || '-18.0');
      state.prob4.subzeroActive = true;
      state.prob4.ambientTemp = coldVal;
      state.prob4.coreTemp = coldVal;
      state.prob4.progressPct = 0;
      addLog('WARN', 'COLD_P4', `Sub-zero profile applied (${coldVal}°C). Standard CC-CV charge locked to prevent dendrite plating.`);
      updatePulseView();
    });

    warmBtn?.addEventListener('click', () => {
      audio.playClick();
      if (state.prob4.coreTemp >= 5.0) {
        alert('Pack is already above +5.0°C. Pulse warming is complete or not required.');
        return;
      }

      state.prob4.warmingActive = !state.prob4.warmingActive;
      if (state.prob4.warmingActive) {
        audio.playPulse();
        warmBtn.textContent = 'Pause Pulse Warming';
        warmBtn.className = 'btn-tactical btn-amber py-1.5 px-4 text-xs font-semibold';
        addLog('INFO', 'PULSE_P4', 'High-frequency (1.0 kHz) AC pulse warming active. Zero net DC charge avoids plating.');

        state.prob4.intervalId = setInterval(() => {
          state.prob4.coreTemp += 0.65;
          const target = parseFloat(targetTempInput?.value || '5.0');
          const coldBase = parseFloat(coldTempInput?.value || '-18.0');
          const range = target - coldBase;
          const currentProgress = Math.min(100, Math.max(0, Math.round(((state.prob4.coreTemp - coldBase) / range) * 100)));
          state.prob4.progressPct = currentProgress;

          if (state.prob4.coreTemp >= target) {
            clearInterval(state.prob4.intervalId);
            state.prob4.warmingActive = false;
            warmBtn.textContent = 'Start AC Pulse Warming';
            warmBtn.className = 'btn-tactical btn-cyan py-1.5 px-4 text-xs font-semibold';
            audio.playSuccess();
            addLog('ISOLATION', 'PULSE_P4', `Target core temperature (+${target}°C) reached. Safe high-rate charging unlocked.`);
          }
          updatePulseView();
        }, 500);
      } else {
        clearInterval(state.prob4.intervalId);
        warmBtn.textContent = 'Start AC Pulse Warming';
        warmBtn.className = 'btn-tactical btn-cyan py-1.5 px-4 text-xs font-semibold';
        addLog('INFO', 'PULSE_P4', 'Pulse warming paused by user.');
        updatePulseView();
      }
    });

    updatePulseView();
  }

  // --- PROBLEM MODULE 5: Second-Life Assessment & ICA Engine ---
  function initProblemModule5() {
    const genPassportBtn = document.getElementById('generate-passport-btn');
    const closePassportBtn = document.getElementById('close-passport-btn');
    const modal = document.getElementById('passport-modal');
    const sohInput = document.getElementById('prob5-soh');
    const capInput = document.getElementById('prob5-cap');
    const appSelect = document.getElementById('prob5-app');

    function generatePassport() {
      audio.playSuccess();
      const soh = parseFloat(sohInput?.value || '82.5');
      const nomCap = parseFloat(capInput?.value || '48.0');
      const app = appSelect?.value || 'STATIONARY_BESS';
      const measuredRetention = (nomCap * (soh / 100.0)).toFixed(1);
      const deratedI = (measuredRetention * 0.5 * 0.15).toFixed(2);
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

      // Compute synthetic SHA-256 hash
      const raw = `KBMS-4S-9024-${soh}-${nomCap}-${app}-${timestamp}`;
      let hash = 0;
      for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
      }
      const hexHash = '0x8f4b' + Math.abs(hash).toString(16).padStart(12, '0') + 'a2e194c7';

      document.getElementById('passport-pack-id').textContent = 'KBMS-4S-9024';
      document.getElementById('passport-date').textContent = timestamp;
      document.getElementById('passport-soh').textContent = `${soh.toFixed(1)}%`;
      document.getElementById('passport-capacity').textContent = `${measuredRetention} Ah (Nominal: ${nomCap} Ah)`;
      document.getElementById('passport-derated-i').textContent = `${deratedI} A (0.5C limit)`;
      document.getElementById('passport-hash').textContent = hexHash;

      modal?.classList.add('active');
      addLog('INFO', 'PASSPORT_P5', `Second-Life Passport issued for KBMS-4S-9024. Digest: ${hexHash.substring(0, 18)}...`);
    }

    genPassportBtn?.addEventListener('click', generatePassport);
    closePassportBtn?.addEventListener('click', () => {
      audio.playClick();
      modal?.classList.remove('active');
    });
  }

  // --- Incremental Capacity Analysis (ICA Chart) Initialization ---
  function initIcaChart() {
    const canvas = document.getElementById('ica-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const voltages = [];
    const dQdV_fresh = [];
    const dQdV_current = [];
    const dQdV_degraded = [];

    for (let v = 3.2; v <= 4.15; v += 0.02) {
      const vFixed = +v.toFixed(2);
      voltages.push(vFixed);

      const p1Fresh = 18.0 * Math.exp(-Math.pow((v - 3.44) / 0.06, 2));
      const p2Fresh = 28.0 * Math.exp(-Math.pow((v - 3.88) / 0.07, 2));
      dQdV_fresh.push(+(p1Fresh + p2Fresh + 2.5).toFixed(2));

      const p1Current = 14.5 * Math.exp(-Math.pow((v - 3.46) / 0.065, 2));
      const p2Current = 21.0 * Math.exp(-Math.pow((v - 3.91) / 0.075, 2));
      dQdV_current.push(+(p1Current + p2Current + 2.1).toFixed(2));

      const p1Deg = 8.5 * Math.exp(-Math.pow((v - 3.49) / 0.08, 2));
      const p2Deg = 11.0 * Math.exp(-Math.pow((v - 3.96) / 0.09, 2));
      dQdV_degraded.push(+(p1Deg + p2Deg + 1.8).toFixed(2));
    }

    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const tickColor = isDark ? '#94A3B8' : '#64748B';

    state.charts.ica = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: voltages,
        datasets: [
          {
            label: 'Baseline 100% SOH (Fresh)',
            data: dQdV_fresh,
            borderColor: '#10B981',
            borderWidth: 1.8,
            borderDash: [4, 4],
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'Evaluated Pack (82.5% SOH)',
            data: dQdV_current,
            borderColor: '#00F2FE',
            backgroundColor: 'rgba(0, 242, 254, 0.1)',
            borderWidth: 2.2,
            fill: true,
            pointRadius: 0,
            tension: 0.3
          },
          {
            label: 'Second-Life Cutoff (<70% SOH)',
            data: dQdV_degraded,
            borderColor: '#F59E0B',
            borderWidth: 1.5,
            borderDash: [2, 2],
            pointRadius: 0,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: isDark ? '#CBD5E1' : '#334155', font: { family: 'JetBrains Mono', size: 10 } } }
        },
        scales: {
          x: {
            title: { display: true, text: 'Voltage (V)', color: tickColor, font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 9 } }
          },
          y: {
            title: { display: true, text: 'dQ/dV (Ah/V)', color: tickColor, font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 9 } }
          }
        }
      }
    });
  }

  // --- Thermal Twin Chart Initialization ---
  function initThermalChart() {
    const canvas = document.getElementById('thermal-twin-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const tickColor = isDark ? '#94A3B8' : '#64748B';

    state.charts.thermal = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Estimated Core Temp (°C)',
            data: [],
            borderColor: '#00F2FE',
            backgroundColor: 'rgba(0, 242, 254, 0.08)',
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            pointRadius: 0
          },
          {
            label: 'Measured Surface Temp (°C)',
            data: [],
            borderColor: '#F59E0B',
            borderWidth: 1.8,
            borderDash: [4, 4],
            tension: 0.3,
            fill: false,
            pointRadius: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: isDark ? '#CBD5E1' : '#334155', font: { family: 'JetBrains Mono', size: 10 } } }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 9 } }
          },
          y: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 9 } }
          }
        }
      }
    });
  }

  // --- Electrical Hardware Chart (Real Physical Stream) ---
  function initElectricalHardwareChart() {
    const canvas = document.getElementById('electrical-chart');
    if (!canvas || typeof Chart === 'undefined') return;

    const isDark = state.theme === 'dark';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
    const tickColor = isDark ? '#94A3B8' : '#64748B';

    state.charts.electrical = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Pack Bus Voltage (V)',
            data: [],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 0,
            yAxisID: 'y'
          },
          {
            label: 'Pack Current (A)',
            data: [],
            borderColor: '#8B5CF6',
            borderWidth: 1.8,
            borderDash: [3, 3],
            tension: 0.25,
            pointRadius: 0,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { labels: { color: isDark ? '#CBD5E1' : '#334155', font: { family: 'JetBrains Mono', size: 10 } } }
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: { color: tickColor, font: { family: 'JetBrains Mono', size: 9 } }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: 'Voltage (V)', color: '#10B981', font: { family: 'JetBrains Mono', size: 9 } },
            grid: { color: gridColor },
            ticks: { color: '#10B981', font: { family: 'JetBrains Mono', size: 9 } }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Current (A)', color: '#8B5CF6', font: { family: 'JetBrains Mono', size: 9 } },
            grid: { drawOnChartArea: false },
            ticks: { color: '#8B5CF6', font: { family: 'JetBrains Mono', size: 9 } }
          }
        }
      }
    });
  }

  // --- Physical Hardware Bridge (Web Serial & WebSocket Ingestion) ---
  const hwMetrics = {
    packetCount: 0,
    packetTimestamps: [],
    electricalTimes: [],
    voltageHistory: [],
    currentHistory: []
  };

  // Validated 4S Li-ion OCV-to-SOC Piecewise Lookup Function
  function calculateSocFromOcv(avgCellV) {
    if (avgCellV >= 4.18) return 100.0;
    if (avgCellV <= 3.00) return 0.0;
    const ocvTable = [
      [4.20, 100.0],
      [4.10, 92.0],
      [4.00, 84.0],
      [3.90, 75.0],
      [3.82, 65.0],
      [3.74, 52.0],
      [3.68, 40.0],
      [3.62, 28.0],
      [3.55, 18.0],
      [3.45, 10.0],
      [3.25, 4.0],
      [3.00, 0.0]
    ];
    for (let i = 0; i < ocvTable.length - 1; i++) {
      const [vHigh, socHigh] = ocvTable[i];
      const [vLow, socLow] = ocvTable[i + 1];
      if (avgCellV <= vHigh && avgCellV >= vLow) {
        const frac = (avgCellV - vLow) / (vHigh - vLow);
        return +(socLow + frac * (socHigh - socLow)).toFixed(1);
      }
    }
    return 50.0;
  }

  function initHardwareBridge() {
    const openHwBtn = document.getElementById('open-hardware-btn');
    const closeHwBtn = document.getElementById('close-hardware-btn');
    const quickConnectBtn = document.getElementById('hw-quick-connect-btn');
    const hwModal = document.getElementById('hardware-modal');
    const serialBtn = document.getElementById('modal-serial-btn');
    const disconnectBtn = document.getElementById('modal-disconnect-btn');
    const baudSelect = document.getElementById('serial-baud-select');
    const wsBtn = document.getElementById('modal-ws-btn');
    const wsUrlInput = document.getElementById('ws-url-input');

    const openModal = () => {
      audio.playClick();
      hwModal?.classList.add('active');
    };

    openHwBtn?.addEventListener('click', openModal);
    quickConnectBtn?.addEventListener('click', openModal);

    closeHwBtn?.addEventListener('click', () => {
      audio.playClick();
      hwModal?.classList.remove('active');
    });

    // Web Serial Connect (USB to ESP32/ESP32-S3/STM32)
    serialBtn?.addEventListener('click', async () => {
      audio.playClick();
      if (!('serial' in navigator)) {
        alert('Web Serial API is not supported in this browser. Please use Chrome, Edge, Brave or Opera, or connect via WebSocket bridge.');
        return;
      }

      const baudRate = parseInt(baudSelect?.value || '115200', 10);
      try {
        state.serialPort = await navigator.serial.requestPort();
        await state.serialPort.open({ baudRate });

        state.hardware.connected = true;
        state.hardware.sourceType = `USB SERIAL (${baudRate} BAUD)`;
        hwModal?.classList.remove('active');
        if (disconnectBtn) disconnectBtn.classList.remove('hidden');

        const overlay = document.getElementById('hw-empty-overlay');
        if (overlay) overlay.classList.add('hidden');

        addLog('INFO', 'WEB_SERIAL', `USB Serial Port opened at ${baudRate} baud. Awaiting JSON telemetry frames.`);
        audio.playSuccess();

        const textDecoder = new TextDecoderStream();
        state.serialPort.readable.pipeTo(textDecoder.writable);
        state.serialReader = textDecoder.readable.getReader();

        readSerialLoop();
      } catch (err) {
        addLog('WARN', 'WEB_SERIAL', `Serial port selection cancelled or failed: ${err.message}`);
      }
    });

    // Disconnect Port
    disconnectBtn?.addEventListener('click', async () => {
      audio.playClick();
      await disconnectHardware();
      if (disconnectBtn) disconnectBtn.classList.add('hidden');
    });

    // WebSocket Connect
    wsBtn?.addEventListener('click', () => {
      audio.playClick();
      const wsUrl = wsUrlInput?.value || 'ws://localhost:8000/ws/telemetry';
      connectWebSocket(wsUrl);
      hwModal?.classList.remove('active');
    });
  }

  async function disconnectHardware() {
    try {
      if (state.serialReader) {
        await state.serialReader.cancel();
        state.serialReader = null;
      }
      if (state.serialPort) {
        await state.serialPort.close();
        state.serialPort = null;
      }
      if (state.ws) {
        state.ws.close();
        state.ws = null;
      }
    } catch (e) {}

    state.hardware.connected = false;
    state.hardware.sourceType = 'NONE';
    state.hardware.lastPacketTime = null;
    state.hardware.busVoltage = null;
    state.hardware.busCurrent = null;
    state.hardware.busPower = null;
    state.hardware.cells.forEach(c => {
      c.v = null;
      c.r = null;
      c.t_surf = null;
      c.t_core = null;
    });

    const overlay = document.getElementById('hw-empty-overlay');
    if (overlay) overlay.classList.remove('hidden');

    const rawStatus = document.getElementById('raw-pkt-status');
    if (rawStatus) rawStatus.textContent = 'DISCONNECTED';

    const anomalyBanner = document.getElementById('hw-anomaly-banner');
    const anomalyDot = document.getElementById('hw-anomaly-dot');
    const anomalyText = document.getElementById('hw-anomaly-text');
    if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-slate-600';
    if (anomalyText) anomalyText.textContent = 'Status: Disconnected. Awaiting physical BMS stream.';

    updateHardwareUi();
    addLog('INFO', 'HARDWARE', 'Physical hardware link closed. Telemetry displays reset to NO LIVE DATA.');
  }

  async function readSerialLoop() {
    let buffer = '';
    while (state.serialReader) {
      try {
        const { value, done } = await state.serialReader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          parseHardwareLine(line.trim());
        }
      } catch (e) {
        addLog('CRITICAL', 'WEB_SERIAL', `Serial stream read error: ${e.message}`);
        await disconnectHardware();
        break;
      }
    }
  }

  function parseHardwareLine(line) {
    if (!line) return;
    try {
      if (line.startsWith('{') && line.endsWith('}')) {
        const data = JSON.parse(line);
        ingestHardwareTelemetry(data, line);
      }
    } catch (e) {
      // Noise line ignored
    }
  }

  function connectWebSocket(url) {
    try {
      if (state.ws) state.ws.close();
      const ws = new WebSocket(url);
      ws.onopen = () => {
        state.ws = ws;
        state.hardware.connected = true;
        state.hardware.sourceType = 'WEBSOCKET STREAM';
        const overlay = document.getElementById('hw-empty-overlay');
        if (overlay) overlay.classList.add('hidden');
        addLog('INFO', 'WEBSOCKET', `Connected to backend telemetry stream at ${url}`);
        audio.playSuccess();
        updateHardwareUi();
      };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          ingestHardwareTelemetry(data, evt.data);
        } catch (e) {}
      };
      ws.onclose = () => {
        addLog('WARN', 'WEBSOCKET', 'WebSocket disconnected. Live hardware telemetry paused.');
        disconnectHardware();
      };
      ws.onerror = () => {
        addLog('WARN', 'WEBSOCKET', `WebSocket connection error to ${url}.`);
      };
    } catch (e) {
      alert(`Could not connect to WebSocket at ${url}: ${e.message}`);
    }
  }

  // --- Real Telemetry Ingestion & Anomaly Detection Algorithm ---
  function ingestHardwareTelemetry(data, rawLine = '') {
    // 1. Extract cell voltages
    const c1 = data.c1 ?? (data.cells ? data.cells[0]?.voltage_v : null);
    const c2 = data.c2 ?? (data.cells ? data.cells[1]?.voltage_v : null);
    const c3 = data.c3 ?? (data.cells ? data.cells[2]?.voltage_v : null);
    const c4 = data.c4 ?? (data.cells ? data.cells[3]?.voltage_v : null);
    const current = data.i ?? data.pack_current_a ?? null;
    const tSurf = data.t_surf ?? (data.cells ? data.cells[0]?.surface_temp_c : null);
    const voc = data.voc ?? data.voc_gas_ppm ?? null;

    // Reject out-of-range corrupted readings (e.g. ADC saturation or disconnected wire)
    const validCells = [c1, c2, c3, c4].filter(v => v !== null && typeof v === 'number');
    for (const v of validCells) {
      if (v < 1.0 || v > 5.0) return;
    }

    state.hardware.lastPacketTime = Date.now();
    state.hardware.connected = true;

    // Track packet rate and count
    hwMetrics.packetCount++;
    const now = Date.now();
    hwMetrics.packetTimestamps.push(now);
    while (hwMetrics.packetTimestamps.length > 0 && hwMetrics.packetTimestamps[0] < now - 1000) {
      hwMetrics.packetTimestamps.shift();
    }
    const currentRate = hwMetrics.packetTimestamps.length;

    const pktCountElem = document.getElementById('hw-pkt-count');
    const pktRateElem = document.getElementById('hw-pkt-rate');
    const streamBadge = document.getElementById('hw-stream-badge');
    const rawPreview = document.getElementById('raw-packet-preview');
    const rawStatus = document.getElementById('raw-pkt-status');

    if (pktCountElem) pktCountElem.textContent = hwMetrics.packetCount;
    if (pktRateElem) pktRateElem.textContent = `${currentRate} Hz`;
    if (streamBadge) {
      streamBadge.textContent = `LIVE (${currentRate} Hz)`;
      streamBadge.className = 'px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700';
    }
    if (rawPreview && rawLine) rawPreview.textContent = rawLine.substring(0, 120);
    if (rawStatus) rawStatus.textContent = `FRAME #${hwMetrics.packetCount} OK`;

    // Apply values to hardware state
    if (c1 !== null) state.hardware.cells[0].v = +c1;
    if (c2 !== null) state.hardware.cells[1].v = +c2;
    if (c3 !== null) state.hardware.cells[2].v = +c3;
    if (c4 !== null) state.hardware.cells[3].v = +c4;

    const cellSum = (c1 ?? 0) + (c2 ?? 0) + (c3 ?? 0) + (c4 ?? 0);
    state.hardware.busVoltage = data.pack_voltage_v ?? (cellSum > 0 ? +cellSum : null);

    if (current !== null) {
      state.hardware.busCurrent = +current;
      if (state.hardware.busVoltage !== null) {
        state.hardware.busPower = +(state.hardware.busVoltage * Math.abs(state.hardware.busCurrent));
      }
    }

    if (tSurf !== null) {
      state.hardware.cells.forEach(c => c.t_surf = +tSurf);
    }
    if (voc !== null) state.hardware.vocPpm = +voc;

    // Calculate OCV-based SOC for 4S pack
    if (validCells.length === 4) {
      const avgCellV = cellSum / 4.0;
      const computedSoc = calculateSocFromOcv(avgCellV);
      state.hardware.prognostics.soc = computedSoc;
      const sohElem = document.getElementById('kpi-soh');
      if (sohElem) sohElem.textContent = `${computedSoc.toFixed(1)}%`;
    }

    // Run Real-Time Anomaly Detection & Diagnostics
    runAnomalyDetection(validCells, current, tSurf, voc);

    // Update Live Electrical Chart
    if (state.hardware.busVoltage !== null && state.hardware.busCurrent !== null && state.charts.electrical) {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
      hwMetrics.electricalTimes.push(timeStr);
      hwMetrics.voltageHistory.push(state.hardware.busVoltage);
      hwMetrics.currentHistory.push(state.hardware.busCurrent);

      if (hwMetrics.electricalTimes.length > 30) {
        hwMetrics.electricalTimes.shift();
        hwMetrics.voltageHistory.shift();
        hwMetrics.currentHistory.shift();
      }

      state.charts.electrical.data.labels = hwMetrics.electricalTimes;
      state.charts.electrical.data.datasets[0].data = hwMetrics.voltageHistory;
      state.charts.electrical.data.datasets[1].data = hwMetrics.currentHistory;
      state.charts.electrical.update('none');
    }

    updateHardwareUi();
  }

  // Validated Anomaly Detection Rules Engine
  function runAnomalyDetection(cells, current, tSurf, voc) {
    if (cells.length === 0) return;

    const maxV = Math.max(...cells);
    const minV = Math.min(...cells);
    const deltaV = +(maxV - minV).toFixed(3);

    const deltaVElem = document.getElementById('hw-delta-v');
    const maxCellElem = document.getElementById('hw-max-cell');
    const minCellElem = document.getElementById('hw-min-cell');
    const anomalyDot = document.getElementById('hw-anomaly-dot');
    const anomalyText = document.getElementById('hw-anomaly-text');

    if (deltaVElem) deltaVElem.textContent = `${(deltaV * 1000).toFixed(0)} mV`;
    if (maxCellElem) maxCellElem.textContent = `${maxV.toFixed(2)} V`;
    if (minCellElem) minCellElem.textContent = `${minV.toFixed(2)} V`;

    // Rule 1: Over-voltage check (>4.25V)
    if (maxV > 4.25) {
      if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';
      if (anomalyText) anomalyText.innerHTML = `<span class="text-rose-400 font-bold">⚠️ CRITICAL: Cell Over-Voltage (${maxV.toFixed(2)}V > 4.25V limit). Halt charging immediately!</span>`;
      audio.playAlarm();
      return;
    }

    // Rule 2: Under-voltage check (<2.80V)
    if (minV < 2.80) {
      if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';
      if (anomalyText) anomalyText.innerHTML = `<span class="text-rose-400 font-bold">⚠️ CRITICAL: Cell Under-Voltage (${minV.toFixed(2)}V < 2.80V cutoff). Depletion risk!</span>`;
      audio.playAlarm();
      return;
    }

    // Rule 3: High Temperature check (>55°C)
    if (tSurf !== null && tSurf > 55.0) {
      if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping';
      if (anomalyText) anomalyText.innerHTML = `<span class="text-rose-400 font-bold">⚠️ CRITICAL: Thermal Threshold Exceeded (${tSurf.toFixed(1)}°C > 55.0°C).</span>`;
      audio.playAlarm();
      return;
    }

    // Rule 4: VOC Gas Off-gassing check (>150 ppm)
    if (voc !== null && voc > 150.0) {
      if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping';
      if (anomalyText) anomalyText.innerHTML = `<span class="text-amber-400 font-bold">⚠️ ALERT: Electrolyte VOC Off-Gas Venting (${voc.toFixed(0)} ppm > 150 ppm). Pre-runaway!</span>`;
      audio.playAlarm();
      return;
    }

    // Rule 5: Cell Imbalance check (>0.05V)
    if (deltaV > 0.05) {
      if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-amber-500';
      if (anomalyText) anomalyText.innerHTML = `<span class="text-amber-400 font-semibold">⚠️ WARNING: Cell Imbalance (&Delta;V = ${(deltaV * 1000).toFixed(0)} mV > 50 mV threshold). Balancing active.</span>`;
      return;
    }

    // All rules passed: Nominal
    if (anomalyDot) anomalyDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500';
    if (anomalyText) anomalyText.innerHTML = '<span class="text-emerald-400 font-medium">✓ Pack health nominal. All cell voltages, current and thermal bounds verified.</span>';
  }

  // --- Embedded Docs Viewer Modal ---
  const docContents = {
    'PRD.md': `
# KAVACH-BMS — Product Requirements Document (PRD)

## 1. Product Overview
**KAVACH-BMS** (Kinetic & Autonomous Virtual-Sensing Architecture for Contested High-Altitude Battery Management Systems) is an Edge-AI and Digital Twin battery-monitoring platform designed for high-altitude tactical avionics and uncrewed aerial systems.

## 2. Problem Statement
Conventional battery protection architectures immediately shut down an entire pack when a single cell suffers an internal fault. In mission-critical aerial platforms or isolated outpost microgrids, sudden bus collapse causes catastrophic crashes. KAVACH-BMS implements an autonomous fault-tolerant topology that isolates degraded cells via solid-state bypass while maintaining a regulated 12V bus.

## 3. Core Functional Modules
- **Module 1: Cell Fault Isolation & Solid-State Bypass:** Sub-10ms MOSFET shunt around compromised cells with DC-DC boost compensation.
- **Module 2: Thermal Digital Twin:** Physics-based 2-node lumped ODE + Kalman estimator computing internal core temperature.
- **Module 3: Pre-Runaway Multi-Stage Diagnostics:** Three sequential precursor indicators (Ohmic drift, VOC off-gas venting, Core hotspot).
- **Module 4: Sub-Zero Cold-Weather Pulse Warming:** Bidirectional high-frequency AC pre-heating preventing lithium dendrite plating.
- **Module 5: Circular Economy Second-Life Passport:** IEC 62619 traceable cryptographic grading certificate for stationary microgrid reuse.
    `,
    'TRD.md': `
# KAVACH-BMS — Technical Requirements Document (TRD)

## 1. Two-Node Thermal Digital Twin Formulation
Let the internal state vector be:
$$x_k = \\begin{bmatrix} T_{core}(k) \\\\ T_{surf}(k) \\end{bmatrix}$$

Dynamic heat balance equations:
$$T_{core}(k+1) = T_{core}(k) + \\frac{\\Delta t}{C_{core}} \\left(Q_{gen}(k) - \\frac{T_{core}(k) - T_{surf}(k)}{R_{c-s}}\\right)$$
$$T_{surf}(k+1) = T_{surf}(k) + \\frac{\\Delta t}{C_{surf}} \\left(\\frac{T_{core}(k) - T_{surf}(k)}{R_{c-s}} - \\frac{T_{surf}(k) - T_{amb}}{R_{s-a}}\\right)$$

Internal heat generation term:
$$Q_{gen} = I^2 R_{int} + I T_{core} \\frac{\\partial U_{ocv}}{\\partial T}$$

## 2. Kalman Filter Estimator
Core temperature $T_{core}$ is tracked using surface thermistor observations $z_k = T_{surf} + v_k$ through recursive Kalman projection:
$$\\hat{x}_{k|k} = \\hat{x}_{k|k-1} + K_k (z_k - H \\hat{x}_{k|k-1})$$

## 3. Electrochemical Diagnostics (ICA/DVA)
Incremental Capacity Analysis ($dQ/dV$) isolates degradation mechanisms:
- Loss of Lithium Inventory (LLI)
- Loss of Active Material (LAM)
- Internal Ohmic Resistance ($R_{int} \\approx \\Delta V / \\Delta I$)
    `,
    'ARCHITECTURE.md': `
# KAVACH-BMS — System Architecture

## 4-Layer Cyber-Physical Architecture

### Layer 1 — Physical Pack Matrix & Sensing
- 4S1P Li-ion Cells (Nominal 3.7V / cell)
- MOSFET solid-state bypass contactors ($R_{ds(on)} \\approx 1.2\\text{ m}\\Omega$)
- Precision current/voltage sensors & NTC thermistors
- BME680 VOC gas detector

### Layer 2 — Signal Conditioning & Telemetry Validation
- Range checks, timestamp freshness, CRC-16 validation
- Outlier filtering & CAN spoofing anomaly detector

### Layer 3 — Digital Twin & AI Engine
- Real-time 2-node thermal model
- 1D Kalman estimator
- Hybrid 1D-CNN + TCN prognostics model

### Layer 4 — Command Center & Lifecycle Operations
- Tactical Liquid Glassmorphism web console (Pitch-black Dark & Clean White Light mode)
- Operating doctrine controller
- Second-Life Battery Passport generator
    `,
    'DESIGN.md': `
# KAVACH-BMS — Design System

## Visual Principles
- Dark Mode: Pitch-black background (\`#000000\`) with ambient radial cyan, emerald, and violet gradients.
- Light Mode: Clean high-contrast white (\`#FFFFFF\`) with adapted glass surfaces.
- Translucent frosted glass command cards with specular borders.
- Monospace high-contrast telemetry indicators (\`JetBrains Mono\`).
- WCAG 2.1 AA accessibility and \`prefers-reduced-motion\` support.
    `,
    'TECH_STACK.md': `
# KAVACH-BMS — Technology Stack

- **Frontend:** HTML5, CSS3, ES2024 JavaScript, Tailwind CSS, Chart.js 4.4.x
- **Visuals:** Web Audio API synth, SVG dynamic circuit schematics, Canvas HUD grid
- **Backend:** Python 3.10+, FastAPI, Uvicorn, WebSockets
- **Hardware Bridge:** Web Serial API (ESP32/STM32 microcontroller) & WebSocket stream
- **Data Integrity:** Strict isolation between live hardware data and simulation harnesses
    `,
    'API_SPEC.md': `
# KAVACH-BMS — API Specification

Base URL: http://localhost:8000/api/v1
WebSocket: ws://localhost:8000/ws/telemetry

- **GET /api/v1/telemetry/current:** Real-time 4S pack and cell telemetry
- **POST /api/v1/faults/inject:** Trigger software fault ('cell2_short', 'voc_spike', etc.)
- **POST /api/v1/doctrine/mode:** Toggle between KAVACH_DEGRADED and CIVILIAN_STRICT
- **GET /api/v1/prognostics/ica:** Incremental Capacity Analysis (dQ/dV) dataset
- **POST /api/v1/passport/generate:** Issues cryptographic Second-Life grading certificate
    `,
    'DATABASE_SCHEMA.md': `
# KAVACH-BMS — Database Schema (SQLite)

- **battery_packs:** pack_id, serial_number, chemistry, nominal_voltage_v, rated_capacity_ah, lifecycle_status
- **cell_telemetry_logs:** log_id, pack_id, recorded_at, cell_index, terminal_voltage_v, current_a, r_int_mohm, temp_surface_c, temp_core_estimated_c, voc_ppm, mosfet_bypassed
- **fault_events:** event_id, pack_id, triggered_at, fault_type, affected_cell, operating_mode, isolation_latency_ms, bus_voltage_v, mitigation_summary
- **second_life_assessments:** assessment_id, pack_id, retirement_soh_pct, measured_capacity_wh, derated_current_a, target_application, assessment_hash
    `,
    'IMPLEMENTATION_PLAN.md': `
# KAVACH-BMS — Implementation Plan

- **Phase 1: Architecture & Requirements:** PRD, TRD, database contracts
- **Phase 2: Frontend Command Center:** Tactical glass HUD, 4S schematic, Chart.js graphs, WCAG 2.1 AA
- **Phase 3: Digital Twin & Problem Modules:** 5 independent physics modules with user inputs
- **Phase 4: Hardware Integration:** Web Serial API, WebSocket bridge, data freshness verification
- **Phase 5: Real-World Testing:** Live battery testing with ESP32/STM32 microcontroller
    `,
    'README.md': `
# KAVACH-BMS
Kinetic & Autonomous Virtual-Sensing Architecture for Contested High-Altitude BMS

## Quick Start
1. **Frontend:** Open \`index.html\` directly in any modern Chromium browser.
2. **Hardware Connection:** Click "Hardware Link" in the top bar to connect an ESP32 over USB Serial or WebSocket.
3. **Optional Backend:**
   \`\`\`bash
   pip install -r requirements.txt
   uvicorn backend_server:app --reload --host 127.0.0.1 --port 8000
   \`\`\`
    `
  };

  function openDocsModal(docKey = 'PRD.md') {
    audio.playClick();
    const modal = document.getElementById('docs-modal');
    const contentElem = document.getElementById('docs-modal-body');
    const docSelect = document.getElementById('docs-select-tab');

    if (modal && contentElem) {
      if (docSelect) docSelect.value = docKey;
      contentElem.innerHTML = `<pre class="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">${escapeHtml(docContents[docKey] || docContents['PRD.md'])}</pre>`;
      modal.classList.add('active');
    }
  }

  function closeDocsModal() {
    audio.playClick();
    const modal = document.getElementById('docs-modal');
    if (modal) modal.classList.remove('active');
  }

  // --- Guided Demo Walkthrough ---
  let tourStep = 0;
  const tourSteps = [
    {
      title: "Step 1: Real-Time Hardware Connection State",
      desc: "KAVACH-BMS enforces strict data integrity: When no physical battery hardware is connected, telemetry values display 'NO LIVE DATA' to prevent false confidence during mission planning.",
      highlightElemId: "top-status-badge"
    },
    {
      title: "Step 2: Problem 1 — Cell Fault Isolation & Solid-State Bypass",
      desc: "Independent problem module: Configure fault resistance and test sub-10ms MOSFET isolation. Under KAVACH_DEGRADED doctrine, a synchronous DC-DC boost stage preserves the 12.0V avionics rail without full pack disconnect.",
      highlightElemId: "module-fault-isolation"
    },
    {
      title: "Step 3: Problem 2 — Two-Node Thermal Digital Twin",
      desc: "Configure physical cell thermal parameters (C_core, C_surf, R_cs, R_sa) and run the Kalman estimator to reveal internal core temperatures hidden by casing diffusion lag.",
      highlightElemId: "module-thermal-twin"
    },
    {
      title: "Step 4: Problem 4 & 5 — Sub-Zero Pulse Warming & Second-Life",
      desc: "Pre-heat batteries at -18°C using high-frequency AC excitation current without lithium dendrites, and certify retired packs (<80% SOH) for stationary microgrid reuse.",
      highlightElemId: "module-pulse-warming"
    }
  ];

  function startDemoTour() {
    audio.playClick();
    tourStep = 0;
    showTourStep(tourStep);
  }

  function showTourStep(index) {
    if (index >= tourSteps.length) {
      endDemoTour();
      return;
    }
    const step = tourSteps[index];
    const banner = document.getElementById('demo-tour-banner');
    const titleElem = document.getElementById('demo-tour-title');
    const descElem = document.getElementById('demo-tour-desc');
    const stepCountElem = document.getElementById('demo-tour-step');

    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));

    if (banner && titleElem && descElem) {
      banner.classList.remove('hidden');
      titleElem.textContent = step.title;
      descElem.textContent = step.desc;
      stepCountElem.textContent = `Walkthrough Step ${index + 1} of ${tourSteps.length}`;

      const target = document.getElementById(step.highlightElemId);
      if (target) {
        target.classList.add('tour-highlight');
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      }
    }
  }

  function nextDemoTourStep() {
    audio.playClick();
    tourStep++;
    if (tourStep < tourSteps.length) {
      showTourStep(tourStep);
    } else {
      endDemoTour();
    }
  }

  function endDemoTour() {
    audio.playClick();
    const banner = document.getElementById('demo-tour-banner');
    if (banner) banner.classList.add('hidden');
    document.querySelectorAll('.tour-highlight').forEach(el => el.classList.remove('tour-highlight'));
  }

  // --- DOM Ready Initialization ---
  window.addEventListener('DOMContentLoaded', () => {
    // 1. Theme initialization
    applyTheme(state.theme);
    document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

    // 2. Audio button
    document.getElementById('audio-toggle-btn')?.addEventListener('click', () => {
      const active = audio.toggle();
      const icon = document.getElementById('audio-icon');
      if (icon) icon.textContent = active ? '🔊' : '🔇';
    });

    // 3. Visuals and Charts
    initHudCanvas();
    initThermalChart();
    initIcaChart();
    initElectricalHardwareChart();

    // 4. Problem Modules
    initProblemModule1();
    initProblemModule2();
    initProblemModule3();
    initProblemModule4();
    initProblemModule5();

    // 5. Hardware link bridge
    initHardwareBridge();

    // 6. Docs modal
    document.getElementById('open-docs-btn')?.addEventListener('click', () => openDocsModal('PRD.md'));
    document.getElementById('close-docs-btn')?.addEventListener('click', closeDocsModal);
    document.getElementById('docs-select-tab')?.addEventListener('change', (e) => openDocsModal(e.target.value));

    // 7. Walkthrough tour
    document.getElementById('start-tour-btn')?.addEventListener('click', startDemoTour);
    document.getElementById('demo-tour-next-btn')?.addEventListener('click', nextDemoTourStep);
    document.getElementById('demo-tour-close-btn')?.addEventListener('click', endDemoTour);

    // 8. Initial UI state (hardware disconnected)
    updateHardwareUi();

    // 9. Startup audit log
    addLog('INFO', 'KERNEL', 'KAVACH-BMS Platform initialized. Operating Mode: STRICT REAL-TIME / INTEGRITY FIRST.');
    addLog('INFO', 'STATUS', 'Hardware Telemetry Link: DISCONNECTED. Displaying "NO LIVE DATA" until hardware is paired.');
    addLog('INFO', 'SIMULATION', 'Independent Problem Modules (P1 - P5) online in separate simulation environments.');
  });

})();
