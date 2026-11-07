import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class DigitalTwin3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070c);
    this.scene.fog = new THREE.FogExp2(0x05070c, 0.07);

    this.camera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      50
    );
    this.camera.position.set(3.4, 2.0, 3.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;
    this.controls.target.set(0, 0.3, 0);

    this.healthMode = true; // Health X-Ray color coding
    this.currentEngineConfig = 'i6';
    this.explodedFactor = 0.0;

    this.initLights();
    this.initGrid();
    this.buildTwinVehicle();

    window.addEventListener('resize', () => this.onResize());
    this.animate();
  }

  initLights() {
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.8);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    dirLight.position.set(4, 7, 4);
    this.scene.add(dirLight);

    const rimCyan = new THREE.DirectionalLight(0x00e5ff, 1.2);
    rimCyan.position.set(-4, 3, -4);
    this.scene.add(rimCyan);

    const rimAmber = new THREE.DirectionalLight(0xf59e0b, 0.8);
    rimAmber.position.set(4, 2, -4);
    this.scene.add(rimAmber);
  }

  initGrid() {
    const grid = new THREE.GridHelper(16, 32, 0x00e5ff, 0x1e293b);
    grid.position.y = -0.05;
    this.scene.add(grid);
  }

  buildTwinVehicle() {
    this.twinGroup = new THREE.Group();
    this.scene.add(this.twinGroup);

    // Standard Materials
    this.matGlass = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.92,
      opacity: 0.94,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 1.6,
      clearcoat: 1.0,
      side: THREE.DoubleSide
    });

    this.matCarbon = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.45,
      roughness: 0.35,
      side: THREE.DoubleSide
    });

    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.9,
      roughness: 0.2
    });

    this.matExhaust = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.35,
      emissive: 0x000000
    });

    // Health Shading Materials
    this.matEngineHealth = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85
    });

    this.matFuelHealth = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85
    });

    this.matCoolingHealth = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      transparent: true,
      opacity: 0.85
    });

    this.matBrakeHealth = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.85,
      roughness: 0.3,
      emissive: 0x000000
    });

    // Sub-Groups
    this.bodyGroup = new THREE.Group();
    this.engineGroup = new THREE.Group();
    this.fuelGroup = new THREE.Group();
    this.coolingGroup = new THREE.Group();
    this.wheelsGroup = new THREE.Group();
    this.drivetrainGroup = new THREE.Group();
    this.dynoRollersGroup = new THREE.Group();

    this.twinGroup.add(this.bodyGroup);
    this.twinGroup.add(this.engineGroup);
    this.twinGroup.add(this.fuelGroup);
    this.twinGroup.add(this.coolingGroup);
    this.twinGroup.add(this.wheelsGroup);
    this.twinGroup.add(this.drivetrainGroup);
    this.twinGroup.add(this.dynoRollersGroup);

    // Build Car Body
    this.buildBody();

    // Build Engine (Default i6)
    this.buildEngine('i6');

    // Build Fluid Systems (Tank, Pump, Radiator)
    this.buildFluids();

    // Build Wheels & Brakes
    this.buildWheels();

    // Build Dyno Rollers
    this.buildDynoRollers();
  }

  buildBody() {
    const mat = this.matGlass;
    const carbon = this.matCarbon;

    // Curved Hood & Vents
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 1.25), mat);
    hood.position.set(0, 0.50, 1.15);
    hood.rotation.x = 0.08;
    this.bodyGroup.add(hood);

    // Front Bumper & Carbon Splitter
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.26, 0.42), mat);
    bumper.position.set(0, 0.25, 1.84);
    this.bodyGroup.add(bumper);

    const splitter = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.035, 0.45), carbon);
    splitter.position.set(0, 0.12, 1.95);
    this.bodyGroup.add(splitter);

    // Windshield & Double-Bubble Roof
    const wind = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.05, 0.85), mat);
    wind.position.set(0, 0.72, 0.38);
    wind.rotation.x = -0.58;
    this.bodyGroup.add(wind);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.045, 0.95), mat);
    roof.position.set(0, 0.98, -0.32);
    this.bodyGroup.add(roof);

    // Fastback Rear Glass & Decklid
    const rearGlass = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.045, 0.98), mat);
    rearGlass.position.set(0, 0.78, -1.05);
    rearGlass.rotation.x = 0.52;
    this.bodyGroup.add(rearGlass);

    const rearBumper = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.32, 0.48), mat);
    rearBumper.position.set(0, 0.35, -1.75);
    this.bodyGroup.add(rearBumper);

    // Rear Diffuser with Aero Fins
    const diff = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.04, 0.65), carbon);
    diff.position.set(0, 0.12, -1.75);
    diff.rotation.x = -0.15;
    this.bodyGroup.add(diff);

    // GT Rear Wing
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.035, 0.32), carbon);
    wing.position.set(0, 0.88, -1.82);
    this.bodyGroup.add(wing);

    // LED Headlight & Horizon Taillight
    const headLed = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.03, 0.05), new THREE.MeshBasicMaterial({ color: 0x00e5ff }));
    headLed.position.set(0, 0.40, 1.95);
    this.bodyGroup.add(headLed);

    const tailLed = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.04, 0.05), new THREE.MeshBasicMaterial({ color: 0xff0033 }));
    tailLed.position.set(0, 0.52, -1.98);
    this.bodyGroup.add(tailLed);

    // Flank Panels & Side Skirts
    for (let side of [-0.74, 0.74]) {
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.48, 1.62), mat);
      door.position.set(side, 0.44, -0.2);
      this.bodyGroup.add(door);

      const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 2.15), carbon);
      skirt.position.set(side * 1.04, 0.11, -0.05);
      this.bodyGroup.add(skirt);
    }
  }

  buildEngine(cfgKey) {
    this.currentEngineConfig = cfgKey;
    while (this.engineGroup.children.length > 0) {
      this.engineGroup.remove(this.engineGroup.children[0]);
    }
    this.pistons = [];

    this.engineGroup.position.set(0, 0.25, 0.85);

    const isV8 = (cfgKey === 'v8');
    const isV12 = (cfgKey === 'v12');
    const numCyl = (cfgKey === 'i6') ? 6 : (isV8 ? 8 : (isV12 ? 12 : 4));
    const isV = (isV8 || isV12);

    const blockWidth = isV ? 0.48 : 0.34;
    const blockLength = (isV ? numCyl / 2 : numCyl) * 0.11 + 0.12;

    // Engine Block Mesh
    const blockGeo = new THREE.BoxGeometry(blockWidth, 0.36, blockLength);
    this.engineBlockMesh = new THREE.Mesh(blockGeo, this.matEngineHealth);
    this.engineBlockMesh.position.set(0, 0.08, 0);
    this.engineGroup.add(this.engineBlockMesh);

    // Crankshaft
    const crankGeo = new THREE.CylinderGeometry(0.016, 0.016, blockLength - 0.04, 16);
    crankGeo.rotateX(Math.PI / 2);
    this.crankshaftMesh = new THREE.Mesh(crankGeo, this.matSteel);
    this.engineGroup.add(this.crankshaftMesh);

    // Flywheel
    const fwGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.035, 24);
    fwGeo.rotateX(Math.PI / 2);
    const flywheel = new THREE.Mesh(fwGeo, this.matSteel);
    flywheel.position.set(0, 0, -blockLength / 2 - 0.02);
    this.engineGroup.add(flywheel);

    // Cylinders & Moving Pistons
    const countZ = isV ? numCyl / 2 : numCyl;
    for (let i = 0; i < numCyl; i++) {
      let zIdx = i;
      let bankAngle = 0;
      if (isV) {
        zIdx = Math.floor(i / 2);
        bankAngle = (i % 2 === 0 ? -1 : 1) * (isV8 ? Math.PI / 4 : Math.PI / 6);
      }
      const z = (zIdx - (countZ - 1) / 2) * 0.11;

      const pMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.05, 16), this.matSteel);
      this.engineGroup.add(pMesh);
      this.pistons.push({
        mesh: pMesh,
        z,
        bankAngle,
        phase: (i * (720 / numCyl) * Math.PI) / 180.0
      });
    }

    // Exhaust Manifold
    this.exhaustManifold = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.15, blockLength * 0.8), this.matExhaust);
    this.exhaustManifold.position.set(blockWidth / 2 + 0.08, 0.08, 0);
    this.engineGroup.add(this.exhaustManifold);
  }

  buildFluids() {
    this.fuelGroup.position.set(0, 0.26, -1.35);

    const tankGeo = new THREE.BoxGeometry(0.58, 0.40, 0.45);
    this.tankMesh = new THREE.Mesh(tankGeo, this.matFuelHealth);
    this.fuelGroup.add(this.tankMesh);

    this.fuelLiquidMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.36, 0.42),
      new THREE.MeshPhysicalMaterial({ color: 0xf59e0b, transmission: 0.7, transparent: true, opacity: 0.85 })
    );
    this.fuelGroup.add(this.fuelLiquidMesh);

    // Fuel Pump
    const pumpGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 20);
    this.pumpMesh = new THREE.Mesh(pumpGeo, this.matFuelHealth);
    this.pumpMesh.position.set(0.32, 0, 0);
    this.fuelGroup.add(this.pumpMesh);

    // Radiator
    this.coolingGroup.position.set(0, 0.28, 1.75);

    const radGeo = new THREE.BoxGeometry(0.68, 0.40, 0.06);
    this.radiatorMesh = new THREE.Mesh(radGeo, this.matCoolingHealth);
    this.coolingGroup.add(this.radiatorMesh);

    this.fans = [];
    for (let f of [-0.18, 0.18]) {
      const fanGeo = new THREE.BoxGeometry(0.02, 0.24, 0.02);
      const fan = new THREE.Mesh(fanGeo, this.matSteel);
      fan.position.set(f, 0, -0.04);
      this.coolingGroup.add(fan);
      this.fans.push(fan);
    }
  }

  buildWheels() {
    this.wheels = [];
    this.brakeDiscs = [];

    const wheelPositions = [
      { x: -0.80, y: 0.28, z: 1.25, isFront: true, isLeft: true },
      { x: 0.80, y: 0.28, z: 1.25, isFront: true, isLeft: false },
      { x: -0.80, y: 0.28, z: -1.35, isFront: false, isLeft: true },
      { x: 0.80, y: 0.28, z: -1.35, isFront: false, isLeft: false }
    ];

    for (let wp of wheelPositions) {
      const hub = new THREE.Group();
      hub.position.set(wp.x, wp.y, wp.z);

      const rotating = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.24, 28), this.matCarbon);
      tire.rotateZ(Math.PI / 2);
      rotating.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.25, 20), this.matSteel);
      rim.rotateZ(Math.PI / 2);
      rotating.add(rim);

      // Ventilated Brake Disc
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24), this.matBrakeHealth.clone());
      disc.rotateZ(Math.PI / 2);
      disc.position.x = wp.isLeft ? 0.06 : -0.06;
      rotating.add(disc);
      this.brakeDiscs.push(disc);

      hub.add(rotating);
      this.wheelsGroup.add(hub);

      this.wheels.push({ hub, rotating, isFront: wp.isFront, isLeft: wp.isLeft });
    }
  }

  buildDynoRollers() {
    const rollerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95, roughness: 0.2 });
    this.dynoRollers = [];

    for (let z of [1.25, -1.35]) {
      const pit = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.06, 0.85), new THREE.MeshStandardMaterial({ color: 0x0f172a }));
      pit.position.set(0, -0.04, z);
      this.dynoRollersGroup.add(pit);

      for (let side of [-0.80, 0.80]) {
        for (let rOffset of [-0.14, 0.14]) {
          const roller = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.32, 20), rollerMat);
          roller.rotateZ(Math.PI / 2);
          roller.position.set(side, -0.01, z + rOffset);
          this.dynoRollersGroup.add(roller);
          this.dynoRollers.push(roller);
        }
      }
    }
  }

  updateFromTelemetry(telemetry, health, activeDTCs) {
    if (!telemetry) return;

    // 1. Dynamic Engine Swap Sync: If physical car swapped engine, rebuild 3D engine!
    if (telemetry.engineConfig && telemetry.engineConfig !== this.currentEngineConfig) {
      this.buildEngine(telemetry.engineConfig);
    }

    // 2. Synchronize Crankshaft & Pistons
    const crankRad = ((telemetry.crankAngle || 0) * Math.PI) / 180.0;
    if (this.crankshaftMesh) {
      this.crankshaftMesh.rotation.z = crankRad;
    }
    for (let p of this.pistons) {
      const r = 0.045;
      const pY = 0.12 + Math.cos(crankRad + p.phase) * r;
      p.mesh.position.set(Math.sin(p.bankAngle) * pY, Math.cos(p.bankAngle) * pY, p.z);
    }

    // 3. Synchronize Wheels, Steering & Dyno Rollers
    for (let w of this.wheels) {
      w.rotating.rotation.x = telemetry.wheelAngle || 0;
      if (w.isFront) {
        w.hub.rotation.y = telemetry.steeringAngle || 0;
      }
    }
    for (let r of this.dynoRollers) {
      r.rotation.x += (telemetry.speedKmh || 0) * 0.05;
    }

    // 4. Synchronize Dyno Rollers Visibility
    if (telemetry.dynoRollersActive !== undefined) {
      this.dynoRollersGroup.visible = telemetry.dynoRollersActive;
    }

    // 5. Synchronize Liquid Level in Fuel Tank
    if (this.fuelLiquidMesh && telemetry.fuelLevel !== undefined) {
      const level = Math.max(0.02, Math.min(1.0, telemetry.fuelLevel));
      this.fuelLiquidMesh.scale.y = level;
      this.fuelLiquidMesh.position.y = - (1.0 - level) * 0.18;
    }

    // 6. Radiator Fans
    if (telemetry.coolantTemp > 80.0 || telemetry.engineRunning) {
      for (let fan of this.fans) {
        fan.rotation.z += 0.4;
      }
    }

    // 7. Dynamic Thermal Heat Glow on Exhaust Manifold & Brake Discs
    if (this.exhaustManifold && telemetry.exhaustTemp) {
      const exhRatio = Math.max(0, Math.min(1.0, (telemetry.exhaustTemp - 80) / 680.0));
      if (exhRatio > 0.05) {
        this.exhaustManifold.material.emissive.setRGB(exhRatio * 1.0, exhRatio * 0.3, 0);
      } else {
        this.exhaustManifold.material.emissive.setRGB(0, 0, 0);
      }
    }

    if (telemetry.brakeTemp) {
      const brakeRatio = Math.max(0, Math.min(1.0, (telemetry.brakeTemp - 45) / 500.0));
      for (let bd of this.brakeDiscs) {
        if (brakeRatio > 0.05) {
          bd.material.emissive.setRGB(brakeRatio * 1.0, brakeRatio * 0.25, 0);
        } else {
          bd.material.emissive.setRGB(0, 0, 0);
        }
      }
    }

    // 8. Synchronize Exploded View Slider from Virtual Car!
    if (telemetry.explodedFactor !== undefined) {
      const ef = telemetry.explodedFactor;
      this.bodyGroup.position.set(0, ef * 0.52, 0);
      for (let w of this.wheels) {
        const sign = w.isLeft ? -1 : 1;
        w.hub.position.x = (sign * 0.80) + (sign * ef * 0.38);
      }
      this.fuelGroup.position.set(0, 0.26, -1.35 - ef * 0.35);
      this.coolingGroup.position.set(0, 0.28, 1.75 + ef * 0.35);
    }

    // 9. Component Diagnostic Health Shaders (X-Ray Health Mode)
    if (this.healthMode && health) {
      const dtcCodes = (activeDTCs || []).map(d => d.code);

      const getHealthColor = (score, hasDtc) => {
        if (hasDtc || score < 60) return 0xef4444; // Red Alert
        if (score < 80) return 0xf59e0b; // Amber Warning
        return 0x10b981; // Green Healthy
      };

      // Engine
      const engHasDtc = dtcCodes.includes('P0217') || dtcCodes.includes('P0524') || dtcCodes.includes('P0300');
      this.matEngineHealth.color.setHex(getHealthColor(health.powertrain, engHasDtc));
      this.matEngineHealth.emissive.setHex(engHasDtc ? 0xef4444 : 0x059669);

      // Cooling
      const coolHasDtc = dtcCodes.includes('P0217');
      this.matCoolingHealth.color.setHex(getHealthColor(health.cooling, coolHasDtc));

      // Fuel System
      const fuelHasDtc = dtcCodes.includes('P0087') || dtcCodes.includes('P0171');
      this.matFuelHealth.color.setHex(getHealthColor(health.fuelSystem, fuelHasDtc));
    }
  }

  setCameraPreset(name) {
    if (name === 'iso') {
      this.camera.position.set(3.4, 2.0, 3.8);
      this.controls.target.set(0, 0.3, 0);
    } else if (name === 'engine') {
      this.camera.position.set(1.2, 1.1, 1.6);
      this.controls.target.set(0, 0.3, 0.85);
    } else if (name === 'fuel') {
      this.camera.position.set(1.3, 0.9, -1.0);
      this.controls.target.set(0, 0.3, -1.35);
    } else if (name === 'chassis') {
      this.camera.position.set(2.8, 0.5, 0);
      this.controls.target.set(0, 0.2, 0);
    }
  }

  onResize() {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

