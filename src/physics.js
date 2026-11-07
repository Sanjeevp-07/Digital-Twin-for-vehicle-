// Physics & Powertrain Simulation Engine
export const ENGINE_CONFIGS = {
  i6: {
    name: 'Inline-6 3.0L DOHC',
    cylinders: 6,
    displacement: 2.998,
    layout: 'inline',
    bore: 82.0,
    stroke: 94.6,
    compressionRatio: 11.0,
    idleRpm: 750,
    redlineRpm: 7200,
    maxTorque: 500, // Nm
    maxHp: 382,     // HP
    firingOrder: [1, 5, 3, 6, 2, 4],
    crankOffsets: [0, 240, 120, 120, 240, 0], // crank pin angles in degrees
    pistonOffsets: [0, 4, 2, 2, 4, 0] // cylinder cycle phase
  },
  i4: {
    name: 'Inline-4 2.0L Turbo',
    cylinders: 4,
    displacement: 1.998,
    layout: 'inline',
    bore: 82.0,
    stroke: 94.6,
    compressionRatio: 10.2,
    idleRpm: 850,
    redlineRpm: 7600,
    maxTorque: 400,
    maxHp: 306,
    firingOrder: [1, 3, 4, 2],
    crankOffsets: [0, 180, 180, 0],
    pistonOffsets: [0, 2, 3, 1]
  },
  v8: {
    name: 'V8 5.0L Crossplane',
    cylinders: 8,
    displacement: 5.038,
    layout: 'v',
    bankAngle: 90,
    bore: 93.0,
    stroke: 92.7,
    compressionRatio: 12.0,
    idleRpm: 680,
    redlineRpm: 7500,
    maxTorque: 570,
    maxHp: 480,
    firingOrder: [1, 8, 4, 3, 6, 5, 7, 2],
    crankOffsets: [0, 90, 270, 180],
    pistonOffsets: [0, 7, 3, 2, 5, 4, 6, 1]
  },
  v12: {
    name: 'V12 6.5L Supercar',
    cylinders: 12,
    displacement: 6.498,
    layout: 'v',
    bankAngle: 60,
    bore: 95.0,
    stroke: 76.4,
    compressionRatio: 11.8,
    idleRpm: 850,
    redlineRpm: 8700,
    maxTorque: 720,
    maxHp: 770,
    firingOrder: [1, 12, 5, 8, 3, 10, 6, 7, 2, 11, 4, 9],
    crankOffsets: [0, 120, 240, 240, 120, 0],
    pistonOffsets: [0, 11, 4, 7, 2, 9, 5, 6, 1, 10, 3, 8]
  },
  boxer4: {
    name: 'Boxer-4 2.5L Flat',
    cylinders: 4,
    displacement: 2.457,
    layout: 'boxer',
    bankAngle: 180,
    bore: 99.5,
    stroke: 79.0,
    compressionRatio: 10.6,
    idleRpm: 750,
    redlineRpm: 6800,
    maxTorque: 392,
    maxHp: 310,
    firingOrder: [1, 3, 2, 4],
    crankOffsets: [0, 180, 180, 0],
    pistonOffsets: [0, 2, 1, 3]
  }
};

export class PhysicsSimulator {
  constructor() {
    this.currentConfigKey = 'i6';
    this.cfg = ENGINE_CONFIGS[this.currentConfigKey];

    // Engine Core States
    this.running = false;
    this.starterActive = false;
    this.starterTime = 0;
    this.rpm = 0;
    this.targetRpm = 0;
    this.crankAngle = 0; // 0 to 720 degrees
    this.throttle = 0;   // 0.0 to 1.0
    this.brake = 0;      // 0.0 to 1.0
    this.clutch = 0;     // 0.0 (engaged) to 1.0 (disengaged)
    this.autoClutch = true;

    // Drivetrain
    this.gear = 0; // 0: N, -1: R, 1..6
    this.gearRatios = {
      '-1': -3.4,
      '0': 0.0,
      '1': 3.6,
      '2': 2.15,
      '3': 1.45,
      '4': 1.05,
      '5': 0.82,
      '6': 0.68
    };
    this.finalDrive = 3.73;
    this.wheelRadius = 0.33; // meters
    this.carMass = 1450;     // kg

    // Dynamics
    this.speedKmh = 0;
    this.speedMs = 0;
    this.wheelRotSpeed = 0; // rad/s
    this.wheelAngle = 0;
    this.steeringAngle = 0; // radians (-0.45 to +0.45)
    this.distanceTraveled = 0;

    // Turbo Boost & Intake
    this.boostPressure = -0.75; // bar (vacuum at idle, positive under boost)

    // Fluid & Thermal Systems
    this.fuelLevel = 1.0; // 100%
    this.fuelCapacity = 65.0; // Liters
    this.fuelPumpActive = true;
    this.fuelRailPressure = 0.0; // bar
    this.fuelFlowRate = 0.0; // L/h
    this.coolingFanActive = true;
    this.ambientTemp = 25.0; // °C
    this.coolantTemp = 25.0; // °C
    this.oilPressure = 0.0;  // bar
    this.oilTemp = 25.0;     // °C
    this.exhaustTemp = 25.0; // °C
    this.brakeTemp = 25.0;   // °C

    // Time scaling
    this.timeScale = 1.0;

    // Performance Benchmarking
    this.launchTimer = {
      active: false,
      startTime: 0,
      time0to60: null,
      time0to100: null,
      timeQuarterMile: null,
      quarterSpeed: null
    };

    // Diagnostics Log Callback
    this.onLog = null;
  }

  log(msg, type = 'normal') {
    if (this.onLog) {
      this.onLog(msg, type);
    }
  }

  setEngineConfig(key) {
    if (!ENGINE_CONFIGS[key]) return;
    this.currentConfigKey = key;
    this.cfg = ENGINE_CONFIGS[key];
    this.log(`Swapped engine to: ${this.cfg.name}`, 'highlight');
    if (this.running) {
      this.rpm = this.cfg.idleRpm;
    }
  }

  startEngine() {
    if (this.running) return;
    if (this.fuelLevel <= 0.001) {
      this.log('Cannot start: Fuel tank is empty!', 'alert');
      return;
    }
    if (!this.fuelPumpActive) {
      this.log('Warning: High pressure fuel pump is disabled!', 'warn');
    }
    this.starterActive = true;
    this.starterTime = 0;
    this.log('Starter motor engaged...', 'normal');
  }

  stopEngine() {
    this.running = false;
    this.starterActive = false;
    this.log('Engine stopped.', 'warn');
  }

  shiftGear(newGear) {
    if (newGear < -1 || newGear > 6) return;
    const oldGear = this.gear;
    this.gear = newGear;
    const gearNames = { '-1': 'Reverse', '0': 'Neutral', '1': '1st', '2': '2nd', '3': '3rd', '4': '4th', '5': '5th', '6': '6th' };
    this.log(`Shifted ${gearNames[oldGear]} ➔ ${gearNames[newGear]}`, 'normal');
  }

  shiftUp() {
    if (this.gear < 6) this.shiftGear(this.gear + 1);
  }

  shiftDown() {
    if (this.gear > -1) this.shiftGear(this.gear - 1);
  }

  refuel() {
    this.fuelLevel = 1.0;
    this.log('Fuel tank filled to 100% (65.0 Liters)', 'highlight');
  }

  update(dtReal) {
    const dt = Math.min(dtReal, 0.05) * this.timeScale;

    // 1. Starter Motor Logic
    if (this.starterActive) {
      this.starterTime += dt;
      // Starter cranks at ~250-300 RPM
      this.rpm = Math.min(280, this.rpm + 600 * dt);
      if (this.starterTime > 0.8) {
        this.starterActive = false;
        this.running = true;
        this.rpm = this.cfg.idleRpm;
        this.log(`${this.cfg.name} ignited! Idle stabilized at ${this.cfg.idleRpm} RPM.`, 'highlight');
      }
    }

    // 2. Fuel Supply & Fuel Pump
    if (this.fuelPumpActive && this.fuelLevel > 0) {
      // Primed to ~4.8 bar
      this.fuelRailPressure = Math.min(5.0, this.fuelRailPressure + 12.0 * dt);
    } else {
      this.fuelRailPressure = Math.max(0.0, this.fuelRailPressure - 2.5 * dt);
      if (this.running && this.fuelRailPressure < 1.2) {
        this.running = false;
        this.log('Fuel rail pressure lost. Engine stalled.', 'alert');
      }
    }

    // 3. Engine RPM & Throttle Physics
    if (this.running) {
      // Out of fuel?
      if (this.fuelLevel <= 0) {
        this.running = false;
        this.fuelLevel = 0;
        this.log('Out of fuel. Engine died.', 'alert');
      }

      // Fuel consumption rate
      // Base consumption ~1.2 L/h at idle up to 45 L/h at redline & full throttle
      const rpmRatio = this.rpm / this.cfg.redlineRpm;
      const throttleFactor = 1.0 + this.throttle * 4.0;
      this.fuelFlowRate = (1.2 + 35.0 * Math.pow(rpmRatio, 1.8) * throttleFactor) * (this.cfg.displacement / 3.0);
      
      // Drain fuel tank: L/h to Liters per second
      const fuelUsedLiters = (this.fuelFlowRate / 3600.0) * dt;
      this.fuelLevel = Math.max(0.0, this.fuelLevel - (fuelUsedLiters / this.fuelCapacity));

      // Calculate Target RPM based on throttle, redline, and drivetrain load
      const gearRatio = this.gearRatios[this.gear.toString()];
      const isNeutralOrClutched = (this.gear === 0 || this.clutch > 0.6);

      if (isNeutralOrClutched) {
        // Free revving with inertia
        this.targetRpm = this.cfg.idleRpm + this.throttle * (this.cfg.redlineRpm - this.cfg.idleRpm);
        // Rev limiter bounce
        if (this.rpm >= this.cfg.redlineRpm - 100 && this.throttle > 0.95) {
          this.targetRpm = this.cfg.redlineRpm - 450; // Cut & bounce
        }
        const revSpeed = 3800; // RPM/sec free rev response
        if (this.rpm < this.targetRpm) {
          this.rpm = Math.min(this.targetRpm, this.rpm + revSpeed * dt);
        } else {
          this.rpm = Math.max(this.targetRpm, this.rpm - (revSpeed * 0.7) * dt);
        }
      } else {
        // Gear engaged: RPM locked to wheel speed, unless slipping
        const totalRatio = gearRatio * this.finalDrive;
        const speedFromWheel = Math.abs(this.wheelRotSpeed * totalRatio * (60.0 / (2.0 * Math.PI)));
        
        // Engine delivers torque to wheels
        const currentTorque = this.calculateTorque();
        const driveForce = (currentTorque * Math.abs(totalRatio)) / this.wheelRadius;
        
        // Resistances: Air drag + Rolling resistance + Brake force
        const airDrag = 0.5 * 1.225 * 0.31 * 2.1 * Math.pow(this.speedMs, 2);
        const rollingResistance = this.carMass * 9.81 * 0.015;
        const brakingForce = this.brake * 14000; // Newtons
        const netForce = (driveForce * (this.gear === -1 ? -1 : 1)) - (airDrag + rollingResistance + brakingForce);

        const acceleration = netForce / this.carMass;
        this.speedMs = Math.max(0, this.speedMs + acceleration * dt);
        this.speedKmh = this.speedMs * 3.6;

        this.wheelRotSpeed = this.speedMs / this.wheelRadius;
        const rpmFromSpeed = Math.abs(this.wheelRotSpeed * totalRatio * (60.0 / (2.0 * Math.PI)));
        
        // Blend RPM with idle stall protection
        if (rpmFromSpeed < this.cfg.idleRpm) {
          if (this.autoClutch) {
            // Auto-clutch slips to prevent stall
            this.rpm = Math.max(this.cfg.idleRpm, this.rpm + (this.throttle * 2000 - 1000) * dt);
          } else {
            // Manual stall if dropped too low in gear
            if (rpmFromSpeed < 350) {
              this.running = false;
              this.log('Engine stalled due to low RPM in gear!', 'alert');
            }
            this.rpm = rpmFromSpeed;
          }
        } else {
          this.rpm = Math.min(this.cfg.redlineRpm, rpmFromSpeed);
        }
      }
    } else {
      // Engine Off: RPM decays smoothly to 0
      this.rpm = Math.max(0, this.rpm - 1800 * dt);
      this.fuelFlowRate = 0;
      
      // Car decelerates due to friction
      if (this.speedMs > 0) {
        const brakingForce = this.brake * 14000;
        const decel = (0.5 * 1.225 * 0.31 * 2.1 * Math.pow(this.speedMs, 2) + this.carMass * 9.81 * 0.02 + brakingForce) / this.carMass;
        this.speedMs = Math.max(0, this.speedMs - decel * dt);
        this.speedKmh = this.speedMs * 3.6;
        this.wheelRotSpeed = this.speedMs / this.wheelRadius;
      }
    }

    // 4. Update Crankshaft & Wheel Rotation Angles
    // Engine crank angle: 720 degrees per full 4-stroke cycle
    // (rpm / 60) * 360 * dt = crank degrees per dt
    const crankDeltaDeg = (this.rpm / 60.0) * 360.0 * dt;
    this.crankAngle = (this.crankAngle + crankDeltaDeg) % 720.0;

    // Wheel angle (for tires spinning in 3D)
    this.wheelAngle += this.wheelRotSpeed * dt;
    this.distanceTraveled += this.speedMs * dt;

    // 5. Thermal Systems & Pressures
    // Oil pressure follows RPM
    if (this.running) {
      const targetOilPress = 1.2 + (this.rpm / this.cfg.redlineRpm) * 4.6;
      this.oilPressure += (targetOilPress - this.oilPressure) * Math.min(1.0, 5.0 * dt);
      
      // Engine heat generation
      const heatGen = (this.rpm / 3000.0) * (0.8 + this.throttle * 1.5);
      const fanCooling = (this.coolingFanActive && this.coolantTemp > 82.0) ? 1.8 : 0.4;
      const speedCooling = (this.speedKmh / 120.0) * 1.5;
      
      this.coolantTemp = Math.min(115.0, Math.max(this.ambientTemp, this.coolantTemp + (heatGen - fanCooling - speedCooling) * 0.8 * dt));
      this.oilTemp = Math.min(130.0, Math.max(this.ambientTemp, this.oilTemp + (heatGen * 1.1 - fanCooling * 0.7) * 0.6 * dt));
      
      // Exhaust heat (rises sharply with throttle and RPM)
      const targetExhaust = this.ambientTemp + (this.rpm / this.cfg.redlineRpm) * 550.0 + (this.throttle * 250.0);
      this.exhaustTemp += (targetExhaust - this.exhaustTemp) * Math.min(1.0, 2.0 * dt);

      // Turbo Boost Dynamics: -0.75 bar vacuum up to +1.85 bar boost
      const targetBoost = -0.75 + (this.throttle * 2.5) * Math.pow(this.rpm / this.cfg.redlineRpm, 1.2);
      this.boostPressure += (targetBoost - this.boostPressure) * Math.min(1.0, 4.0 * dt);
    } else {
      this.oilPressure = Math.max(0, this.oilPressure - 6.0 * dt);
      this.coolantTemp = Math.max(this.ambientTemp, this.coolantTemp - 0.5 * dt);
      this.oilTemp = Math.max(this.ambientTemp, this.oilTemp - 0.4 * dt);
      this.exhaustTemp = Math.max(this.ambientTemp, this.exhaustTemp - 3.5 * dt);
      this.boostPressure += (0.0 - this.boostPressure) * Math.min(1.0, 3.0 * dt);
    }

    // Brake disc temperature & glow
    if (this.brake > 0.05 && this.speedKmh > 5) {
      this.brakeTemp = Math.min(750, this.brakeTemp + (this.brake * (this.speedKmh / 100.0) * 120.0) * dt);
    } else {
      const coolingRate = 5.0 + (this.speedKmh / 50.0) * 15.0;
      this.brakeTemp = Math.max(this.ambientTemp, this.brakeTemp - coolingRate * dt);
    }

    // 6. Launch Timer & Performance Benchmarks
    this.updateLaunchTimer(dt);
  }

  updateLaunchTimer(dt) {
    if (this.speedKmh < 0.5 && this.throttle > 0.8 && this.gear >= 1) {
      // Primed to launch
      this.launchTimer.active = true;
      this.launchTimer.startTime = 0;
      this.launchTimer.time0to60 = null;
      this.launchTimer.time0to100 = null;
      this.launchTimer.timeQuarterMile = null;
      this.launchTimer.quarterDist = 0;
    }

    if (this.launchTimer.active) {
      this.launchTimer.startTime += dt;
      this.launchTimer.quarterDist += this.speedMs * dt;

      // 0-60 mph (96.56 km/h)
      if (this.speedKmh >= 96.56 && this.launchTimer.time0to60 === null) {
        this.launchTimer.time0to60 = this.launchTimer.startTime.toFixed(2);
        this.log(`⏱️ 0-60 MPH benchmark: ${this.launchTimer.time0to60}s`, 'highlight');
      }

      // 0-100 km/h
      if (this.speedKmh >= 100.0 && this.launchTimer.time0to100 === null) {
        this.launchTimer.time0to100 = this.launchTimer.startTime.toFixed(2);
        this.log(`⏱️ 0-100 KM/H benchmark: ${this.launchTimer.time0to100}s`, 'highlight');
      }

      // 1/4 mile (402.3 meters)
      if (this.launchTimer.quarterDist >= 402.3 && this.launchTimer.timeQuarterMile === null) {
        this.launchTimer.timeQuarterMile = this.launchTimer.startTime.toFixed(2);
        this.launchTimer.quarterSpeed = this.speedKmh.toFixed(1);
        this.launchTimer.active = false;
        this.log(`🏁 1/4 Mile: ${this.launchTimer.timeQuarterMile}s @ ${this.launchTimer.quarterSpeed} km/h`, 'highlight');
      }
    }
  }

  calculateTorque() {
    if (!this.running || this.rpm < 200) return 0;
    // Characteristic torque curve based on RPM
    const rpmNorm = (this.rpm - this.cfg.idleRpm) / (this.cfg.redlineRpm - this.cfg.idleRpm);
    // Smooth bell-shaped volumetric efficiency curve
    const curve = Math.sin(Math.min(Math.PI, Math.max(0, rpmNorm * Math.PI * 0.95 + 0.15)));
    return (this.cfg.maxTorque * (0.35 + 0.65 * curve)) * (0.15 + 0.85 * this.throttle);
  }

  calculateHorsepower() {
    // HP = (Torque_Nm * RPM) / 7127
    const torque = this.calculateTorque();
    return (torque * this.rpm) / 7127.0;
  }

  // Thermodynamic Indicator for Cylinder 1
  getCylinder1Thermodynamics() {
    // Crank angle in 4-stroke cycle: 0° to 720°
    // 0° - 180° : Intake Stroke (atmospheric pressure, volume increases)
    // 180° - 360° : Compression Stroke (isentropic compression, volume drops to V_c)
    // 360° : Spark Ignition Flash (constant volume pressure spike)
    // 360° - 540° : Power / Expansion Stroke (expanding gas drives piston down)
    // 540° - 720° : Exhaust Stroke (exhaust valve opens, pressure releases to manifold)
    const angle = this.crankAngle;
    let strokeName = 'INTAKE';
    let pressure = 1.0; // bar
    const r = this.cfg.compressionRatio;

    // Normalized volume between 1 (TDC, clearance volume) and r (BDC, total volume)
    // Piston position formula
    const rad = (angle * Math.PI) / 180.0;
    const normPiston = 0.5 * (1 - Math.cos(rad)); // 0 at TDC, 1 at BDC
    const volume = 1.0 + (r - 1.0) * normPiston; // 1 to r

    if (angle < 180) {
      strokeName = 'INTAKE';
      // Slight vacuum under intake throttle
      pressure = 0.8 + 0.2 * this.throttle;
    } else if (angle < 360) {
      strokeName = 'COMPRESSION';
      // Polytropic compression P * V^1.3 = const
      const compProgress = (angle - 180) / 180.0;
      pressure = 1.0 + Math.pow(r, 1.3) * Math.pow(compProgress, 2.5);
    } else if (angle < 540) {
      strokeName = 'POWER / COMBUSTION';
      const expProgress = (angle - 360) / 180.0;
      if (this.running) {
        // Peak combustion spike at ~370-380 degrees
        const peakPress = 18.0 + (this.throttle * 45.0) * (this.rpm / 4000.0);
        pressure = peakPress * Math.exp(-expProgress * 3.0) + 2.0;
      } else {
        pressure = 2.0;
      }
    } else {
      strokeName = 'EXHAUST';
      const exhProgress = (angle - 540) / 180.0;
      pressure = 1.8 - exhProgress * 0.7;
    }

    return {
      strokeName,
      pressure: Math.max(0.9, pressure),
      volume, // 1 to r
      angle
    };
  }
}

