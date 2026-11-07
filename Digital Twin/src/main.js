import { DigitalTwin3D } from './twin-3d.js';
import { TelemetryCharts } from './charts.js';
import { DiagnosticsManager } from './diagnostics.js';

class DigitalTwinApp {
  constructor() {
    this.twin3d = new DigitalTwin3D('twin-viewport-container');
    this.charts = new TelemetryCharts('telemetry-chart');
    this.diag = new DiagnosticsManager();

    this.socket = null;
    this.connected = false;
    this.packetCount = 0;
    this.fpsCounter = 0;
    this.broadcastChannel = null;

    this.initBroadcastFallback();
    this.initWebSocket();
    this.initUIControls();

    setInterval(() => {
      const rateEl = document.getElementById('stream-rate');
      if (rateEl) rateEl.innerText = `${this.fpsCounter} Hz`;
      this.fpsCounter = 0;
    }, 1000);
  }

  initBroadcastFallback() {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('connected_car_telematics_stream');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'TELEMETRY_FRAME') {
            this.handleTelemetryFrame(event.data.payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel fallback not supported');
      }
    }
  }

  initWebSocket() {
    const wsUrl = 'ws://localhost:8080?role=dashboard';

    const connect = () => {
      try {
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.connected = true;
          this.updateConnectionStatus(true);
          this.diag.logTerminal('Connected to Cloud Ingestion Server (ws://localhost:8080)', 'highlight');
        };

        this.socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_STREAM') {
              this.handleTelemetryFrame(data.payload, data.health, data.activeDTCs);
            } else if (data.type === 'INITIAL_STATE_SHADOW') {
              this.diag.logTerminal(`Vehicle State Shadow Ingested [VIN: ${data.shadow.vin}]`, 'highlight');
              if (data.shadow.telemetry) {
                this.handleTelemetryFrame(data.shadow.telemetry, data.shadow.health, data.shadow.activeDTCs);
              }
            } else if (data.type === 'VEHICLE_CONNECTED') {
              this.diag.logTerminal(`Physical Connected Vehicle Online: [${data.vin}]`, 'highlight');
              this.updateConnectionStatus(true);
            } else if (data.type === 'VEHICLE_DISCONNECTED') {
              this.diag.logTerminal(`Physical Vehicle Telematics Link Lost. Ingestion standby.`, 'alert');
              this.updateConnectionStatus(false);
            }
          } catch (e) {
            console.error('Error handling WebSocket message:', e);
          }
        };

        this.socket.onclose = () => {
          this.connected = false;
          this.updateConnectionStatus(false);
          setTimeout(connect, 3000);
        };

        this.socket.onerror = () => {
          this.connected = false;
          this.updateConnectionStatus(false);
        };
      } catch (e) {
        this.connected = false;
        this.updateConnectionStatus(false);
        setTimeout(connect, 3000);
      }
    };

    connect();
  }

  updateConnectionStatus(isOnline) {
    const pill = document.getElementById('conn-status-pill');
    const text = document.getElementById('conn-status-text');
    if (!pill || !text) return;

    if (isOnline) {
      pill.className = 'status-pill';
      text.innerText = 'VEHICLE STREAM LIVE 🟢';
    } else {
      pill.className = 'status-pill offline';
      text.innerText = 'WAITING FOR PHYSICAL CAR...';
    }
  }

  handleTelemetryFrame(t, health, activeDTCs) {
    if (!t) return;
    this.packetCount++;
    this.fpsCounter++;
    document.getElementById('packets-count').innerText = this.packetCount.toLocaleString();

    // 1. Update 3D Twin Model (Kinematics, Exploded View, Dyno Rollers, Health Shaders)
    this.twin3d.updateFromTelemetry(t, health, activeDTCs);

    // 2. Update Multi-Channel Oscilloscope
    this.charts.pushSample(t);

    // 3. Update Health Matrix & Active OBD-II DTCs
    if (health) this.diag.updateHealthMatrix(health);
    if (activeDTCs) {
      this.diag.updateDTCList(activeDTCs);
      const dtcCountBadge = document.getElementById('dtc-count-badge');
      if (dtcCountBadge) {
        dtcCountBadge.innerText = `${activeDTCs.length} ACTIVE`;
        dtcCountBadge.style.color = activeDTCs.length > 0 ? 'var(--color-red)' : 'var(--color-green)';
      }
    }

    // 4. Update Kinematics Strip
    document.getElementById('twin-rpm').innerText = t.rpm || 0;
    document.getElementById('twin-speed').innerHTML = `${t.speedKmh || 0} <span style="font-size:10px;">KM/H</span>`;
    
    const gearNames = { '-1': 'R', '0': 'N', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6' };
    document.getElementById('twin-gear').innerText = gearNames[t.gear?.toString()] || 'N';
    document.getElementById('twin-throttle').innerText = `${Math.round((t.throttle || 0) * 100)}%`;
    
    const boost = t.boostPressure || 0;
    document.getElementById('twin-boost').innerText = boost >= 0 ? `+${boost.toFixed(2)} bar` : `${boost.toFixed(2)} bar`;

    // 5. Update Driver Kinematics & Configuration Card
    if (t.engineConfigName) {
      document.getElementById('twin-engine-name').innerText = t.engineConfigName;
    }
    const steerDeg = ((t.steeringAngle || 0) * 180 / Math.PI).toFixed(1);
    document.getElementById('twin-steer-angle').innerText = `${steerDeg}°`;
    document.getElementById('twin-brake-force').innerText = `${Math.round((t.brake || 0) * 100)}%`;
    document.getElementById('twin-clutch-pos').innerText = `${Math.round((t.clutch || 0) * 100)}% ${t.clutch > 0.5 ? '(Disengaged)' : '(Engaged)'}`;
    
    const ef = Math.round((t.explodedFactor || 0) * 100);
    document.getElementById('twin-exploded-factor').innerText = `${ef}% ${ef > 5 ? '(Expanded)' : '(Collapsed)'}`;
    
    document.getElementById('twin-dyno-status').innerText = t.dynoRollersActive ? 'Engaged 🟢' : 'Retracted';
    document.getElementById('twin-odo').innerText = `${(t.distanceTraveled || 0).toFixed(1)} km`;
    document.getElementById('twin-ambient').innerText = `${t.ambientTemp || 25} °C`;

    // 6. Update Real-Time Sensor Grid
    document.getElementById('sensor-coolant').innerText = `${(t.coolantTemp || 25).toFixed(1)} °C`;
    document.getElementById('sensor-oil').innerText = `${(t.oilPressure || 0).toFixed(2)} bar`;
    document.getElementById('sensor-fuel-press').innerText = `${(t.fuelRailPressure || 0).toFixed(2)} bar`;
    document.getElementById('sensor-fuel-flow').innerText = `${(t.fuelFlowRate || 0).toFixed(1)} L/h`;
    document.getElementById('sensor-exhaust').innerText = `${(t.exhaustTemp || 25).toFixed(1)} °C`;
    document.getElementById('sensor-brake').innerText = `${(t.brakeTemp || 25).toFixed(1)} °C`;

    const fuelLiters = ((t.fuelLevel || 1.0) * 65.0).toFixed(1);
    document.getElementById('sensor-fuel-level').innerText = `${Math.round((t.fuelLevel || 1.0) * 100)}% (${fuelLiters} L)`;
    
    const pumpStateEl = document.getElementById('sensor-pump-state');
    if (pumpStateEl) {
      pumpStateEl.innerText = t.fuelPumpActive ? 'ACTIVE 🟢' : 'OFF 🔴';
      pumpStateEl.style.color = t.fuelPumpActive ? 'var(--color-green)' : 'var(--color-red)';
    }

    document.getElementById('sensor-power').innerText = `${t.horsepower || 0} HP / ${t.torque || 0} Nm`;

    // 7. Update Predictive Maintenance Models
    const dist = t.distanceTraveled || 0;
    const oilKm = Math.max(0, 10000 - Math.round(dist * 10));
    document.getElementById('pm-oil-km').innerText = `${oilKm.toLocaleString()} km`;

    const brakeMm = Math.max(2.0, (12.0 - dist * 0.015)).toFixed(1);
    document.getElementById('pm-brake-mm').innerText = `${brakeMm} mm`;
  }

  initUIControls() {
    const camBtns = [
      { id: 'btn-cam-iso', name: 'iso' },
      { id: 'btn-cam-engine', name: 'engine' },
      { id: 'btn-cam-fuel', name: 'fuel' },
      { id: 'btn-cam-chassis', name: 'chassis' }
    ];

    camBtns.forEach(cb => {
      const el = document.getElementById(cb.id);
      if (el) {
        el.addEventListener('click', () => {
          camBtns.forEach(b => document.getElementById(b.id)?.classList.remove('active'));
          el.classList.add('active');
          this.twin3d.setCameraPreset(cb.name);
        });
      }
    });

    const btnHealthToggle = document.getElementById('btn-toggle-health');
    if (btnHealthToggle) {
      btnHealthToggle.addEventListener('click', () => {
        this.twin3d.healthMode = !this.twin3d.healthMode;
        btnHealthToggle.classList.toggle('active', this.twin3d.healthMode);
        this.diag.logTerminal(`Diagnostic Health Shaders: ${this.twin3d.healthMode ? 'ENABLED' : 'DISABLED'}`, 'highlight');
      });
    }

    document.getElementById('btn-clear-dtcs')?.addEventListener('click', () => {
      this.diag.updateDTCList([]);
      const dtcCountBadge = document.getElementById('dtc-count-badge');
      if (dtcCountBadge) {
        dtcCountBadge.innerText = '0 ACTIVE';
        dtcCountBadge.style.color = 'var(--color-green)';
      }
      this.diag.logTerminal('Active DTC log reset in Cloud Monitoring Shadow.', 'highlight');
    });

    document.getElementById('btn-clear-term')?.addEventListener('click', () => {
      const term = document.getElementById('ingest-log');
      if (term) term.innerHTML = '';
    });

    document.getElementById('btn-open-car')?.addEventListener('click', () => {
      window.open('http://localhost:3000', '_blank');
    });
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new DigitalTwinApp();
});

