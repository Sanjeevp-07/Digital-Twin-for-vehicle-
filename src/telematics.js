// IoT Connected Vehicle Telematics Control Unit (TCU) & Cloud Gateway

export class VehicleTelematicsGateway {
  constructor(physics, car, engine, fluids, ui) {
    this.physics = physics;
    this.car = car;
    this.engine = engine;
    this.fluids = fluids;
    this.ui = ui;

    this.vin = 'AGY-TWIN-2026-X1';
    this.wsUrl = 'ws://localhost:8080?role=vehicle';
    this.socket = null;
    this.connected = false;
    this.lastPing = 0;
    this.latencyMs = 0;
    this.packetsSent = 0;
    this.txInterval = null;

    // Cross-tab fallback channel
    this.broadcastChannel = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('connected_car_telematics_stream');
        this.broadcastChannel.onmessage = (event) => this.handleIncomingOta(event.data);
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment');
      }
    }

    this.connect();
    this.startStreaming();
  }

  connect() {
    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.connected = true;
        this.updatePillUI();
        this.physics.log('☁️ Telematics Gateway connected to Cloud Digital Twin (Port 8080)', 'highlight');
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleIncomingOta(msg);
        } catch (e) {
          console.error('Error parsing cloud message:', e);
        }
      };

      this.socket.onclose = () => {
        this.connected = false;
        this.updatePillUI();
        // Reconnect after 3 seconds
        setTimeout(() => this.connect(), 3000);
      };

      this.socket.onerror = () => {
        this.connected = false;
        this.updatePillUI();
      };
    } catch (e) {
      this.connected = false;
      this.updatePillUI();
      setTimeout(() => this.connect(), 3000);
    }
  }

  handleIncomingOta(msg) {
    if (!msg || msg.type !== 'OTA_COMMAND') return;

    const cmd = msg.command;
    this.physics.log(`📲 Inbound OTA Command received: ${cmd}`, 'warn');

    let success = true;

    if (cmd === 'COMMAND_ENGINE_START') {
      this.physics.startEngine();
    } else if (cmd === 'COMMAND_ENGINE_KILL') {
      this.physics.stopEngine();
    } else if (cmd === 'COMMAND_REFUEL') {
      this.physics.refuel();
      const slider = document.getElementById('fuel-slider');
      if (slider) slider.value = 100;
    } else if (cmd === 'COMMAND_DRIVING_MODE') {
      const mode = msg.params?.mode || 'SPORT';
      this.physics.log(`Over-the-Air Driving Mode switched to: ${mode}`, 'highlight');
    } else if (cmd === 'COMMAND_DIAGNOSTIC_SWEEP') {
      this.physics.log(`Running On-Board Diagnostic System Sweep...`, 'normal');
      setTimeout(() => {
        this.physics.log(`OBD-II Self-Test Complete. All bus systems nominal.`, 'highlight');
      }, 1000);
    }

    // Acknowledge back to Cloud
    const ack = {
      type: 'OTA_ACK',
      command: cmd,
      status: success ? 'SUCCESS' : 'FAILED',
      timestamp: Date.now()
    };

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(ack));
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(ack);
    }
  }

  startStreaming() {
    // 30 Hz Telemetry Transmission Loop
    this.txInterval = setInterval(() => {
      this.transmitFrame();
    }, 33);
  }

  transmitFrame() {
    const payload = {
      vin: this.vin,
      timestamp: Date.now(),
      engineRunning: this.physics.running,
      starterActive: this.physics.starterActive,
      rpm: Math.round(this.physics.rpm),
      speedKmh: Math.round(this.physics.speedKmh),
      gear: this.physics.gear,
      throttle: parseFloat(this.physics.throttle.toFixed(2)),
      brake: parseFloat(this.physics.brake.toFixed(2)),
      clutch: parseFloat(this.physics.clutch.toFixed(2)),
      steeringAngle: parseFloat(this.physics.steeringAngle.toFixed(3)),
      fuelLevel: parseFloat(this.physics.fuelLevel.toFixed(3)),
      fuelFlowRate: parseFloat(this.physics.fuelFlowRate.toFixed(2)),
      fuelRailPressure: parseFloat(this.physics.fuelRailPressure.toFixed(2)),
      fuelPumpActive: this.physics.fuelPumpActive,
      coolantTemp: parseFloat(this.physics.coolantTemp.toFixed(1)),
      oilPressure: parseFloat(this.physics.oilPressure.toFixed(2)),
      oilTemp: parseFloat(this.physics.oilTemp.toFixed(1)),
      exhaustTemp: parseFloat(this.physics.exhaustTemp.toFixed(1)),
      brakeTemp: parseFloat(this.physics.brakeTemp.toFixed(1)),
      boostPressure: parseFloat(this.physics.boostPressure.toFixed(2)),
      horsepower: Math.round(this.physics.calculateHorsepower()),
      torque: Math.round(this.physics.calculateTorque()),
      distanceTraveled: parseFloat((this.physics.distanceTraveled / 1000.0).toFixed(2)),
      crankAngle: parseFloat(this.physics.crankAngle.toFixed(1)),
      wheelAngle: parseFloat(this.physics.wheelAngle.toFixed(2)),
      timeScale: this.physics.timeScale,
      engineConfig: this.physics.currentConfigKey,
      engineConfigName: this.physics.cfg?.name || 'Inline-6 3.0L',
      explodedFactor: parseFloat((this.ui?.explodedFactor || 0).toFixed(2)),
      dynoRollersActive: !!(this.car?.dynoRollersGroup?.visible),
      coolingFanActive: this.physics.coolingFanActive,
      ambientTemp: this.physics.ambientTemp,
      cylinders: this.physics.cfg?.cylinders || 6,
      displacement: this.physics.cfg?.displacement || 3.0
    };

    const envelope = {
      type: 'TELEMETRY_FRAME',
      vin: this.vin,
      payload
    };

    const serialized = JSON.stringify(envelope);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(serialized);
      this.packetsSent++;
    }

    // Always mirror to cross-tab BroadcastChannel for zero-latency multi-window view
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(envelope);
    }

    this.updatePillUI();
  }

  updatePillUI() {
    const pill = document.getElementById('cloud-telematics-pill');
    if (!pill) return;

    if (this.connected) {
      pill.innerHTML = `☁️ CLOUD TWIN: <span style="color:#10b981;">CONNECTED 🟢</span> <span style="font-size:9px; color:#94a3b8;">(${this.packetsSent} PKTS)</span>`;
      pill.style.borderColor = 'rgba(16, 185, 129, 0.4)';
    } else {
      pill.innerHTML = `☁️ CLOUD TWIN: <span style="color:#f59e0b;">BROADCASTING 📡</span>`;
      pill.style.borderColor = 'rgba(245, 158, 11, 0.4)';
    }
  }
}

