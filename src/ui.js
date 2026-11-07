// User Interface & Telemetry HUD Coordinator

export class UIController {
  constructor(physics, car, engine, fluids, audio, cameraRig) {
    this.physics = physics;
    this.car = car;
    this.engine = engine;
    this.fluids = fluids;
    this.audio = audio;
    this.cameraRig = cameraRig;

    this.keysDown = {};
    this.explodedFactor = 0.0;
    this.targetExploded = 0.0;

    // Canvas contexts
    this.dynoCanvas = document.getElementById('dyno-canvas');
    this.dynoCtx = this.dynoCanvas ? this.dynoCanvas.getContext('2d') : null;

    this.pvCanvas = document.getElementById('pv-canvas');
    this.pvCtx = this.pvCanvas ? this.pvCanvas.getContext('2d') : null;

    this.schematicCanvas = document.getElementById('schematic-canvas');
    this.schematicCtx = this.schematicCanvas ? this.schematicCanvas.getContext('2d') : null;

    this.initDOM();
    this.initKeyboard();
    this.initLogs();
  }

  initDOM() {
    // Engine Start / Stop
    const btnStart = document.getElementById('btn-engine-start');
    const btnStop = document.getElementById('btn-engine-stop');

    if (btnStart) {
      btnStart.addEventListener('click', () => {
        this.audio.init();
        this.physics.startEngine();
      });
    }
    if (btnStop) {
      btnStop.addEventListener('click', () => {
        this.physics.stopEngine();
      });
    }

    // Engine Selector
    const engineSelect = document.getElementById('engine-select');
    if (engineSelect) {
      engineSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        this.physics.setEngineConfig(val);
        this.engine.buildEngine(val);
        document.getElementById('engine-type-tag').innerText = this.physics.cfg.name.toUpperCase();
      });
    }

    // Throttle Slider
    const throttleSlider = document.getElementById('throttle-slider');
    if (throttleSlider) {
      throttleSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100.0;
        this.physics.throttle = val;
        document.getElementById('throttle-val').innerText = `${Math.round(val * 100)}%`;
      });
    }

    // Gear Buttons
    const gearBtns = document.querySelectorAll('.gear-btn');
    gearBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const g = parseInt(btn.getAttribute('data-gear'));
        this.physics.shiftGear(g);
        this.updateGearUI();
      });
    });

    // Shift Paddles
    const btnShiftUp = document.getElementById('btn-shift-up');
    const btnShiftDown = document.getElementById('btn-shift-down');
    if (btnShiftUp) {
      btnShiftUp.addEventListener('click', () => {
        this.physics.shiftUp();
        this.updateGearUI();
      });
    }
    if (btnShiftDown) {
      btnShiftDown.addEventListener('click', () => {
        this.physics.shiftDown();
        this.updateGearUI();
      });
    }

    // Auto-clutch toggle
    const toggleAutoclutch = document.getElementById('toggle-autoclutch');
    const clutchRow = document.getElementById('clutch-slider-row');
    if (toggleAutoclutch) {
      toggleAutoclutch.addEventListener('change', (e) => {
        this.physics.autoClutch = e.target.checked;
        if (clutchRow) clutchRow.style.display = e.target.checked ? 'none' : 'flex';
      });
    }

    // Clutch Slider
    const clutchSlider = document.getElementById('clutch-slider');
    if (clutchSlider) {
      clutchSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100.0;
        this.physics.clutch = 1.0 - val;
        document.getElementById('clutch-val').innerText = `${Math.round(val * 100)}%`;
      });
    }

    // Refuel Button & Fuel Slider
    const btnRefuel = document.getElementById('btn-refuel');
    if (btnRefuel) {
      btnRefuel.addEventListener('click', () => {
        this.physics.refuel();
        const fuelSlider = document.getElementById('fuel-slider');
        if (fuelSlider) fuelSlider.value = 100;
      });
    }
    const fuelSlider = document.getElementById('fuel-slider');
    if (fuelSlider) {
      fuelSlider.addEventListener('input', (e) => {
        this.physics.fuelLevel = parseFloat(e.target.value) / 100.0;
      });
    }

    // Fuel Pump Toggle
    const toggleFuelPump = document.getElementById('toggle-fuel-pump');
    if (toggleFuelPump) {
      toggleFuelPump.addEventListener('change', (e) => {
        this.physics.fuelPumpActive = e.target.checked;
      });
    }

    // Cooling Fan Toggle
    const toggleCoolingFan = document.getElementById('toggle-cooling-fan');
    if (toggleCoolingFan) {
      toggleCoolingFan.addEventListener('change', (e) => {
        this.physics.coolingFanActive = e.target.checked;
      });
    }

    // Ambient Slider
    const ambientSlider = document.getElementById('ambient-slider');
    if (ambientSlider) {
      ambientSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.physics.ambientTemp = val;
        document.getElementById('ambient-temp-val').innerText = `${val} °C`;
      });
    }

    // Body Material Selector
    const bodySelect = document.getElementById('body-mode-select');
    if (bodySelect) {
      bodySelect.addEventListener('change', (e) => {
        this.car.setBodyMode(e.target.value);
      });
    }

    // Exploded View Slider
    const explodedSlider = document.getElementById('exploded-slider');
    if (explodedSlider) {
      explodedSlider.addEventListener('input', (e) => {
        this.targetExploded = parseFloat(e.target.value) / 100.0;
        document.getElementById('exploded-val').innerText = `${Math.round(this.targetExploded * 100)}%`;
      });
    }

    // Subsystem Toggles
    const setupSubsystem = (id, targetObj, subsystem) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('change', (e) => {
          targetObj.setVisibility(subsystem, e.target.checked);
        });
      }
    };
    setupSubsystem('toggle-show-engine', this.engine, 'engine');
    setupSubsystem('toggle-show-fluids', this.fluids, 'fluids');
    setupSubsystem('toggle-show-coolant', this.fluids, 'coolant');
    setupSubsystem('toggle-show-oil', this.fluids, 'oil');
    setupSubsystem('toggle-show-drivetrain', this.car, 'drivetrain');
    setupSubsystem('toggle-show-exhaust', this.engine, 'exhaust');
    setupSubsystem('toggle-show-chassis', this.car, 'chassis');
    setupSubsystem('toggle-show-wheels', this.car, 'wheels');

    // Time Scale Pills
    const timePills = document.querySelectorAll('.time-pill');
    timePills.forEach(pill => {
      pill.addEventListener('click', () => {
        timePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const scale = parseFloat(pill.getAttribute('data-scale'));
        this.physics.timeScale = scale;
        document.getElementById('time-scale-tag').innerText = `${scale}x ${scale === 1 ? 'Realtime' : 'Slow-Mo'}`;
      });
    });

    // Top Bar Camera Buttons
    const camButtons = [
      { id: 'cam-iso', name: 'iso' },
      { id: 'cam-engine', name: 'engine' },
      { id: 'cam-fluids', name: 'fluids' },
      { id: 'cam-cockpit', name: 'cockpit' },
      { id: 'cam-chassis', name: 'chassis' }
    ];
    camButtons.forEach(cb => {
      const el = document.getElementById(cb.id);
      if (el) {
        el.addEventListener('click', () => {
          camButtons.forEach(b => {
            const bEl = document.getElementById(b.id);
            if (bEl) bEl.classList.remove('active');
          });
          el.classList.add('active');
          this.cameraRig.setPreset(cb.name);
        });
      }
    });

    // Audio & Reset & Help Buttons
    const btnAudio = document.getElementById('btn-audio');
    if (btnAudio) {
      btnAudio.addEventListener('click', () => {
        this.audio.init();
        const state = this.audio.toggleAudio();
        btnAudio.innerText = state ? '🔊 Audio ON' : '🔇 Audio OFF';
        btnAudio.classList.toggle('active', state);
      });
    }

    const btnResetCam = document.getElementById('btn-reset-cam');
    if (btnResetCam) {
      btnResetCam.addEventListener('click', () => {
        this.cameraRig.setPreset('iso');
      });
    }

    // Virtual Chassis Dyno Rollers Toggle
    const btnDynoMode = document.getElementById('btn-dyno-mode');
    if (btnDynoMode) {
      btnDynoMode.addEventListener('click', () => {
        const isVisible = !this.car.dynoRollersGroup.visible;
        this.car.dynoRollersGroup.visible = isVisible;
        btnDynoMode.classList.toggle('active', isVisible);
        this.physics.log(isVisible ? 'Virtual Chassis Dyno Rollers Engaged.' : 'Chassis Dyno Rollers Retracted.', 'highlight');
      });
    }

    // Help Modal
    const helpModal = document.getElementById('help-modal');
    const btnHelp = document.getElementById('btn-help');
    const btnCloseModal = document.getElementById('btn-close-modal');
    if (btnHelp && helpModal) {
      btnHelp.addEventListener('click', () => helpModal.style.display = 'flex');
    }
    if (btnCloseModal && helpModal) {
      btnCloseModal.addEventListener('click', () => helpModal.style.display = 'none');
    }

    // Clear log button
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
      btnClearLog.addEventListener('click', () => {
        const logBox = document.getElementById('event-log');
        if (logBox) logBox.innerHTML = '';
      });
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      this.keysDown[e.key.toLowerCase()] = true;

      // Audio init on first keystroke
      this.audio.init();

      if (e.key === 'q' || e.key === 'Q') {
        this.physics.shiftDown();
        this.updateGearUI();
      } else if (e.key === 'e' || e.key === 'E') {
        this.physics.shiftUp();
        this.updateGearUI();
      } else if (e.key === 'Enter') {
        if (this.physics.running) {
          this.physics.stopEngine();
        } else {
          this.physics.startEngine();
        }
      } else if (e.key === 'x' || e.key === 'X') {
        // Toggle exploded view
        this.targetExploded = (this.targetExploded > 0.3) ? 0.0 : 1.0;
        const slider = document.getElementById('exploded-slider');
        if (slider) slider.value = Math.round(this.targetExploded * 100);
        document.getElementById('exploded-val').innerText = `${Math.round(this.targetExploded * 100)}%`;
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown[e.key.toLowerCase()] = false;
    });
  }

  initLogs() {
    this.physics.onLog = (msg, type) => {
      const logBox = document.getElementById('event-log');
      if (!logBox) return;

      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.innerHTML = `<span class="log-time">[${timeStr}]</span> <span class="log-msg ${type}">${msg}</span>`;
      logBox.appendChild(entry);
      logBox.scrollTop = logBox.scrollHeight;
    };

    // Initial greeting logs
    this.physics.log('Car & Engine Simulator initialized.', 'highlight');
    this.physics.log('Electric fuel pump online. System primed at 4.8 bar.', 'normal');
    this.physics.log('Press START ENGINE or Hit ENTER to crank.', 'warn');
  }

  updateGearUI() {
    const gearBtns = document.querySelectorAll('.gear-btn');
    gearBtns.forEach(btn => {
      const g = parseInt(btn.getAttribute('data-gear'));
      btn.classList.toggle('active', g === this.physics.gear);
    });
  }

  update(dt) {
    // 1. Process continuous keyboard driving input
    const isW = this.keysDown['w'] || this.keysDown['arrowup'];
    const isS = this.keysDown['s'] || this.keysDown['arrowdown'] || this.keysDown[' '];
    const isC = this.keysDown['c'];

    if (isW) {
      this.physics.throttle = Math.min(1.0, this.physics.throttle + 2.5 * dt);
      const throttleSlider = document.getElementById('throttle-slider');
      if (throttleSlider) throttleSlider.value = Math.round(this.physics.throttle * 100);
      document.getElementById('throttle-val').innerText = `${Math.round(this.physics.throttle * 100)}%`;
    } else if (document.activeElement !== document.getElementById('throttle-slider')) {
      // Return slowly to idle if not dragging slider
      const sliderVal = parseFloat(document.getElementById('throttle-slider').value) / 100.0;
      this.physics.throttle += (sliderVal - this.physics.throttle) * 6.0 * dt;
    }

    if (isS) {
      this.physics.brake = Math.min(1.0, this.physics.brake + 4.0 * dt);
    } else {
      this.physics.brake = Math.max(0.0, this.physics.brake - 5.0 * dt);
    }

    // Steering controls (A / D or ArrowLeft / ArrowRight)
    const isA = this.keysDown['a'] || this.keysDown['arrowleft'];
    const isD = this.keysDown['d'] || this.keysDown['arrowright'];

    if (isA) {
      this.physics.steeringAngle = Math.max(-0.48, this.physics.steeringAngle - 2.2 * dt);
    } else if (isD) {
      this.physics.steeringAngle = Math.min(0.48, this.physics.steeringAngle + 2.2 * dt);
    } else {
      // Auto-center spring
      this.physics.steeringAngle += (0.0 - this.physics.steeringAngle) * 5.5 * dt;
    }

    if (isC) {
      this.physics.clutch = 1.0; // Disengaged
    } else if (!this.physics.autoClutch) {
      const clutchSlider = document.getElementById('clutch-slider');
      if (clutchSlider) {
        this.physics.clutch = 1.0 - (parseFloat(clutchSlider.value) / 100.0);
      }
    }

    // 2. Smooth Exploded View Interpolation
    this.explodedFactor += (this.targetExploded - this.explodedFactor) * 5.0 * dt;

    // 3. Update HUD DOM Elements
    document.getElementById('hud-rpm').innerText = Math.round(this.physics.rpm);
    document.getElementById('hud-speed').innerText = Math.round(this.physics.speedKmh);
    document.getElementById('hud-hp').innerText = `${Math.round(this.physics.calculateHorsepower())} HP`;
    document.getElementById('hud-torque').innerText = `${Math.round(this.physics.calculateTorque())} Nm`;
    document.getElementById('hud-fuel-flow').innerText = `${this.physics.fuelFlowRate.toFixed(1)} L/h`;
    document.getElementById('hud-fuel-pressure').innerText = `${this.physics.fuelRailPressure.toFixed(1)} bar`;
    document.getElementById('hud-coolant-temp').innerText = `${Math.round(this.physics.coolantTemp)} °C`;
    document.getElementById('hud-oil-pressure').innerText = `${this.physics.oilPressure.toFixed(1)} bar`;
    document.getElementById('hud-exhaust-temp').innerText = `${Math.round(this.physics.exhaustTemp)} °C`;
    document.getElementById('hud-brake-temp').innerText = `${Math.round(this.physics.brakeTemp)} °C`;

    // Turbo Boost & Steering Angle
    const boostEl = document.getElementById('hud-boost');
    if (boostEl) {
      const b = this.physics.boostPressure;
      boostEl.innerText = b >= 0 ? `+${b.toFixed(2)} bar` : `${b.toFixed(2)} bar (Vac)`;
      boostEl.style.color = b > 0.4 ? 'var(--accent-amber)' : 'var(--accent-cyan)';
    }

    const steerEl = document.getElementById('hud-steer');
    if (steerEl) {
      steerEl.innerText = `${(this.physics.steeringAngle * 180 / Math.PI).toFixed(1)}°`;
    }

    // Fuel remaining UI
    const fuelLiters = (this.physics.fuelLevel * this.physics.fuelCapacity).toFixed(1);
    document.getElementById('fuel-val').innerText = `${Math.round(this.physics.fuelLevel * 100)}% (${fuelLiters} L)`;

    // Pedals Fill Heights
    const gasBar = document.getElementById('gas-bar');
    if (gasBar) gasBar.style.height = `${Math.round(this.physics.throttle * 100)}%`;

    const brakeBar = document.getElementById('brake-bar');
    if (brakeBar) brakeBar.style.height = `${Math.round(this.physics.brake * 100)}%`;

    const clutchBar = document.getElementById('clutch-bar');
    if (clutchBar) clutchBar.style.height = `${Math.round(this.physics.clutch * 100)}%`;

    // Start Button Glow State
    const btnStart = document.getElementById('btn-engine-start');
    if (btnStart) {
      btnStart.classList.toggle('running', this.physics.running);
      btnStart.innerText = this.physics.running ? 'ENGINE RUNNING' : 'START ENGINE';
    }

    // Benchmarks
    if (this.physics.launchTimer.time0to60) {
      document.getElementById('stat-0-60').innerText = `${this.physics.launchTimer.time0to60} s`;
    }
    if (this.physics.launchTimer.time0to100) {
      document.getElementById('stat-0-100').innerText = `${this.physics.launchTimer.time0to100} s`;
    }
    if (this.physics.launchTimer.timeQuarterMile) {
      document.getElementById('stat-quarter').innerText = `${this.physics.launchTimer.timeQuarterMile} s`;
    }

    // 4. Render Dynamic Canvas Plots
    this.renderDynoChart();
    this.renderPVDiagram();
    this.renderFluidSchematic();
  }

  // Live Dyno Chart: HP & Torque vs RPM with current tracer dot
  renderDynoChart() {
    if (!this.dynoCtx) return;
    const ctx = this.dynoCtx;
    const w = this.dynoCanvas.width;
    const h = this.dynoCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid lines
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 30; x < w; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 10);
      ctx.lineTo(x, h - 20);
      ctx.stroke();
    }
    for (let y = 15; y < h - 20; y += 25) {
      ctx.beginPath();
      ctx.moveTo(30, y);
      ctx.lineTo(w - 10, y);
      ctx.stroke();
    }

    // Max values for scaling
    const maxRpm = this.physics.cfg.redlineRpm + 500;
    const maxVal = Math.max(this.physics.cfg.maxHp, this.physics.cfg.maxTorque) * 1.15;

    const toX = (rpm) => 30 + (rpm / maxRpm) * (w - 45);
    const toY = (val) => (h - 22) - (val / maxVal) * (h - 35);

    // Draw Torque Curve (Blue)
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    for (let r = 500; r <= this.physics.cfg.redlineRpm; r += 150) {
      const norm = (r - this.physics.cfg.idleRpm) / (this.physics.cfg.redlineRpm - this.physics.cfg.idleRpm);
      const curve = Math.sin(Math.min(Math.PI, Math.max(0, norm * Math.PI * 0.95 + 0.15)));
      const tq = this.physics.cfg.maxTorque * (0.35 + 0.65 * curve);
      const x = toX(r);
      const y = toY(tq);
      if (r === 500) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw HP Curve (Red)
    ctx.beginPath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.2;
    for (let r = 500; r <= this.physics.cfg.redlineRpm; r += 150) {
      const norm = (r - this.physics.cfg.idleRpm) / (this.physics.cfg.redlineRpm - this.physics.cfg.idleRpm);
      const curve = Math.sin(Math.min(Math.PI, Math.max(0, norm * Math.PI * 0.95 + 0.15)));
      const tq = this.physics.cfg.maxTorque * (0.35 + 0.65 * curve);
      const hp = (tq * r) / 7127.0;
      const x = toX(r);
      const y = toY(hp);
      if (r === 500) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Live Tracer Dot
    if (this.physics.rpm > 100) {
      const curX = toX(this.physics.rpm);
      const curHp = this.physics.calculateHorsepower();
      const curY = toY(curHp);

      ctx.beginPath();
      ctx.arc(curX, curY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Cylinder 1 Thermodynamics P-V Diagram
  renderPVDiagram() {
    if (!this.pvCtx) return;
    const ctx = this.pvCtx;
    const w = this.pvCanvas.width;
    const h = this.pvCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const thermo = this.physics.getCylinder1Thermodynamics();
    document.getElementById('cycle-stroke-label').innerText = thermo.strokeName;

    // Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(30, 10, w - 40, h - 30);

    // Reference Ideal Otto Cycle Loop
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    // 1 -> 2 Compression
    ctx.moveTo(w - 20, h - 22);
    ctx.quadraticCurveTo(w * 0.5, h * 0.5, 45, h * 0.38);
    // 2 -> 3 Combustion spike
    ctx.lineTo(45, 18);
    // 3 -> 4 Expansion
    ctx.quadraticCurveTo(w * 0.5, h * 0.35, w - 20, h * 0.65);
    // 4 -> 1 Blowdown
    ctx.lineTo(w - 20, h - 22);
    ctx.stroke();

    // Current Operating Tracer Dot on PV plane
    // Map volume (1 to r) to X (45 to w - 20)
    const r = this.physics.cfg.compressionRatio;
    const curX = 45 + ((thermo.volume - 1.0) / (r - 1.0)) * (w - 65);
    const curY = (h - 22) - Math.min(1.0, thermo.pressure / 50.0) * (h - 38);

    ctx.beginPath();
    ctx.arc(curX, curY, 5, 0, Math.PI * 2);
    ctx.fillStyle = (thermo.strokeName.includes('POWER')) ? '#f59e0b' : '#00e5ff';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Pressure label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px JetBrains Mono';
    ctx.fillText(`${thermo.pressure.toFixed(1)} bar`, curX + 8, curY - 2);
  }

  // 2D Fuel & Coolant Flow Schematic (recreates screenshot diagram!)
  renderFluidSchematic() {
    if (!this.schematicCtx) return;
    const ctx = this.schematicCtx;
    const w = this.schematicCanvas.width;
    const h = this.schematicCanvas.height;

    ctx.clearRect(0, 0, w, h);

    const pumpLabel = document.getElementById('pump-status-label');
    if (pumpLabel) {
      pumpLabel.innerText = this.physics.fuelPumpActive ? 'PUMP ACTIVE' : 'PUMP OFF';
      pumpLabel.style.color = this.physics.fuelPumpActive ? 'var(--accent-green)' : 'var(--accent-red)';
    }

    // 1. Tank Box (Left)
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(12, 18, 48, 64);

    // Liquid fill inside tank
    const fuelH = 60 * this.physics.fuelLevel;
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(14, 18 + (60 - fuelH), 44, fuelH);

    ctx.fillStyle = '#fff';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('TANK', 22, 54);

    // 2. Line from Tank to Pump
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, 50);
    ctx.lineTo(95, 50);
    ctx.stroke();

    // 3. Fuel Pump Circle
    ctx.beginPath();
    ctx.arc(115, 50, 16, 0, Math.PI * 2);
    ctx.fillStyle = this.physics.fuelPumpActive ? '#064e3b' : '#334155';
    ctx.fill();
    ctx.strokeStyle = this.physics.fuelPumpActive ? '#10b981' : '#64748b';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('PUMP', 104, 53);

    // 4. Line to Fuel Rail
    ctx.beginPath();
    ctx.moveTo(131, 50);
    ctx.lineTo(170, 50);
    ctx.stroke();

    // 5. Fuel Rail (Horizontal manifold)
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(170, 32, 115, 12);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '8px JetBrains Mono';
    ctx.fillText(`RAIL ${this.physics.fuelRailPressure.toFixed(1)} bar`, 190, 41);

    // 6. Injectors (Downward arrows)
    for (let i = 0; i < 6; i++) {
      const ix = 180 + i * 18;
      ctx.beginPath();
      ctx.moveTo(ix, 44);
      ctx.lineTo(ix, 68);
      ctx.strokeStyle = '#00e5ff';
      ctx.stroke();

      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(ix - 3, 62);
      ctx.lineTo(ix, 68);
      ctx.lineTo(ix + 3, 62);
      ctx.stroke();
    }

    // Animated particle pulse along line
    if (this.physics.fuelPumpActive && this.physics.fuelFlowRate > 0) {
      const pulseX = 60 + ((Date.now() * 0.05) % 110);
      ctx.beginPath();
      ctx.arc(pulseX, 50, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#00ffff';
      ctx.fill();
    }
  }
}
