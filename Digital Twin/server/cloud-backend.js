import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import http from 'http';

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Digital Twin State Shadow (In-memory real-time state)
let vehicleShadow = {
  vin: 'AGY-TWIN-2026-X1',
  model: 'GT-CyberCoupe Pro Dual-Cam',
  firmware: 'v3.4.2-OTA',
  connected: false,
  lastHeartbeat: 0,
  telemetry: {
    engineRunning: false,
    rpm: 0,
    speedKmh: 0,
    gear: 0,
    throttle: 0,
    brake: 0,
    clutch: 0,
    steeringAngle: 0,
    fuelLevel: 1.0,
    fuelFlowRate: 0.0,
    fuelRailPressure: 0.0,
    fuelPumpActive: true,
    coolantTemp: 25.0,
    oilPressure: 0.0,
    oilTemp: 25.0,
    exhaustTemp: 25.0,
    brakeTemp: 25.0,
    boostPressure: -0.75,
    horsepower: 0,
    torque: 0,
    distanceTraveled: 0,
    timeScale: 1.0,
    crankAngle: 0,
    wheelAngle: 0,
    explodedFactor: 0.0,
    dynoRollersActive: false,
    engineConfig: 'i6',
    engineConfigName: 'Inline-6 3.0L DOHC'
  },
  health: {
    overall: 100,
    powertrain: 100,
    cooling: 100,
    fuelSystem: 100,
    braking: 100,
    oilLife: 100,
    status: 'NORMAL'
  },
  activeDTCs: [],
  dtcHistory: [],
  predictiveMaintenance: {
    oilServiceKmRemaining: 9850,
    brakePadThicknessMm: 11.8,
    coolantLifeDaysRemaining: 340,
    fuelFilterHoursRemaining: 480
  }
};

// WebSocket Clients Registry
const vehicleSockets = new Set();
const dashboardSockets = new Set();

// Evaluation of Automotive Diagnostic Trouble Codes (DTCs / OBD-II)
function evaluateDiagnostics(t) {
  const dtcs = [];

  // P0217: Engine Coolant Over-Temperature
  if (t.coolantTemp > 105.0) {
    dtcs.push({
      code: 'P0217',
      system: 'Cooling System',
      description: 'Engine Coolant Over-Temperature Condition Detected (>105°C)',
      severity: 'CRITICAL',
      timestamp: new Date().toISOString(),
      freezeFrame: { rpm: t.rpm, coolantTemp: t.coolantTemp, speedKmh: t.speedKmh }
    });
  }

  // P0524: Low Engine Oil Pressure under load
  if (t.engineRunning && t.rpm > 1200 && t.oilPressure < 1.1) {
    dtcs.push({
      code: 'P0524',
      system: 'Lubrication',
      description: 'Engine Oil Pressure Too Low (<1.1 bar while engine active)',
      severity: 'CRITICAL',
      timestamp: new Date().toISOString(),
      freezeFrame: { rpm: t.rpm, oilPressure: t.oilPressure }
    });
  }

  // P0087: Fuel Rail Pressure Low
  if (t.engineRunning && t.fuelRailPressure < 1.8) {
    dtcs.push({
      code: 'P0087',
      system: 'Fuel System',
      description: 'Fuel Rail/System Pressure Too Low (<1.8 bar)',
      severity: 'HIGH',
      timestamp: new Date().toISOString(),
      freezeFrame: { fuelRailPressure: t.fuelRailPressure, fuelPumpActive: t.fuelPumpActive }
    });
  }

  // P0171: System Too Lean (Fuel starving)
  if (t.engineRunning && t.fuelLevel <= 0.02) {
    dtcs.push({
      code: 'P0171',
      system: 'Fuel Delivery',
      description: 'Fuel Delivery Starvation / Lean Exhaust Condition Detected',
      severity: 'HIGH',
      timestamp: new Date().toISOString(),
      freezeFrame: { fuelLevel: t.fuelLevel }
    });
  }

  // P0300: High RPM / High Thermal Stress Alert
  if (t.engineRunning && t.rpm >= 7000 && t.exhaustTemp > 650) {
    dtcs.push({
      code: 'P0300',
      system: 'Ignition / Thermal',
      description: 'Thermal Saturation & High-RPM Stress Detected',
      severity: 'MODERATE',
      timestamp: new Date().toISOString(),
      freezeFrame: { rpm: t.rpm, exhaustTemp: t.exhaustTemp }
    });
  }

  // C0035: Brake Thermal Overheating Warning
  if (t.brakeTemp > 450) {
    dtcs.push({
      code: 'C0035',
      system: 'Braking / ABS',
      description: 'Brake Rotor Thermal Saturation (>450°C) - Brake Fade Warning',
      severity: 'MODERATE',
      timestamp: new Date().toISOString(),
      freezeFrame: { brakeTemp: t.brakeTemp, speedKmh: t.speedKmh }
    });
  }

  vehicleShadow.activeDTCs = dtcs;

  // Compute Health Indices (0-100%)
  let pHealth = 100;
  if (t.exhaustTemp > 500) pHealth -= (t.exhaustTemp - 500) * 0.05;
  if (t.oilPressure < 1.8 && t.engineRunning) pHealth -= 20;
  pHealth = Math.max(15, Math.min(100, pHealth));

  let cHealth = 100;
  if (t.coolantTemp > 90) cHealth -= (t.coolantTemp - 90) * 1.5;
  cHealth = Math.max(10, Math.min(100, cHealth));

  let fHealth = 100;
  if (t.fuelRailPressure < 3.5 && t.engineRunning) fHealth -= 30;
  fHealth = Math.max(10, Math.min(100, fHealth));

  let bHealth = 100;
  if (t.brakeTemp > 300) bHealth -= (t.brakeTemp - 300) * 0.08;
  bHealth = Math.max(20, Math.min(100, bHealth));

  const overall = Math.round((pHealth * 0.35) + (cHealth * 0.25) + (fHealth * 0.20) + (bHealth * 0.20));

  vehicleShadow.health = {
    overall,
    powertrain: Math.round(pHealth),
    cooling: Math.round(cHealth),
    fuelSystem: Math.round(fHealth),
    braking: Math.round(bHealth),
    oilLife: Math.max(0, 100 - (t.distanceTraveled / 150)),
    status: overall > 80 ? 'NORMAL' : overall > 60 ? 'ADVISORY' : 'CRITICAL'
  };

  vehicleShadow.predictiveMaintenance.oilServiceKmRemaining = Math.max(0, 10000 - Math.round(t.distanceTraveled * 10));
  vehicleShadow.predictiveMaintenance.brakePadThicknessMm = Math.max(2.0, (12.0 - (t.distanceTraveled * 0.015)).toFixed(1));
}

// WebSocket Telemetry Broker
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://localhost:8080');
  const role = url.searchParams.get('role') || 'dashboard';

  if (role === 'vehicle') {
    vehicleSockets.add(ws);
    vehicleShadow.connected = true;
    console.log(`[CLOUD BACKEND] Vehicle connected: ${vehicleShadow.vin}`);

    broadcastToDashboards({
      type: 'VEHICLE_CONNECTED',
      vin: vehicleShadow.vin,
      timestamp: Date.now()
    });

    ws.on('message', (data) => {
      try {
        const frame = JSON.parse(data.toString());
        if (frame.type === 'TELEMETRY_FRAME') {
          vehicleShadow.telemetry = { ...vehicleShadow.telemetry, ...frame.payload };
          vehicleShadow.lastHeartbeat = Date.now();
          evaluateDiagnostics(vehicleShadow.telemetry);

          broadcastToDashboards({
            type: 'TELEMETRY_STREAM',
            vin: vehicleShadow.vin,
            payload: vehicleShadow.telemetry,
            health: vehicleShadow.health,
            activeDTCs: vehicleShadow.activeDTCs,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.error('[CLOUD BACKEND] Parse error from vehicle telemetry:', err.message);
      }
    });

    ws.on('close', () => {
      vehicleSockets.delete(ws);
      vehicleShadow.connected = false;
      console.log(`[CLOUD BACKEND] Vehicle disconnected.`);
      broadcastToDashboards({
        type: 'VEHICLE_DISCONNECTED',
        vin: vehicleShadow.vin,
        timestamp: Date.now()
      });
    });

  } else {
    // Dashboard client (Monitoring)
    dashboardSockets.add(ws);
    console.log('[CLOUD BACKEND] Monitoring Dashboard connected.');

    ws.send(JSON.stringify({
      type: 'INITIAL_STATE_SHADOW',
      shadow: vehicleShadow
    }));

    ws.on('close', () => {
      dashboardSockets.delete(ws);
    });
  }
});

function broadcastToDashboards(msgObj) {
  const payload = JSON.stringify(msgObj);
  for (let dWs of dashboardSockets) {
    if (dWs.readyState === WebSocket.OPEN) {
      dWs.send(payload);
    }
  }
}

// REST API
app.get('/api/health', (req, res) => {
  res.json({ status: 'UP', timestamp: Date.now(), vehicleConnected: vehicleShadow.connected });
});

app.get('/api/vehicle/shadow', (req, res) => {
  res.json(vehicleShadow);
});

server.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(`🚀 CLOUD DIGITAL TWIN INGESTION SERVER`);
  console.log(`📡 Ingestion WebSocket : ws://localhost:${PORT}?role=vehicle`);
  console.log(`📊 Dashboard WebSocket : ws://localhost:${PORT}?role=dashboard`);
  console.log(`🌐 REST API Endpoints   : http://localhost:${PORT}/api/vehicle/shadow`);
  console.log(`================================================================`);
});

