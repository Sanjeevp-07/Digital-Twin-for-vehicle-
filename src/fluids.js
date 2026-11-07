import * as THREE from 'three';

export class FluidSystems {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Sub-groups
    this.fuelGroup = new THREE.Group();
    this.coolantGroup = new THREE.Group();
    this.oilGroup = new THREE.Group();
    this.brakesGroup = new THREE.Group();

    this.group.add(this.fuelGroup);
    this.group.add(this.coolantGroup);
    this.group.add(this.oilGroup);
    this.group.add(this.brakesGroup);

    // Particle systems & animated elements
    this.fuelParticles = null;
    this.coolantParticles = null;
    this.fuelPumpImpeller = null;
    this.waterPumpImpeller = null;
    this.radiatorFans = [];
    this.fuelLiquidMesh = null;
    this.fuelInjectors = [];

    this.initMaterials();
    this.buildFuelSystem();
    this.buildCoolingSystem();
    this.buildOilSystem();
    this.buildBrakeHydraulics();
  }

  initMaterials() {
    // Glass for transparent tank & pump housing
    this.matClearGlass = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transmission: 0.92,
      opacity: 0.95,
      transparent: true,
      roughness: 0.08,
      ior: 1.5,
      thickness: 0.8
    });

    // Amber Fuel Liquid
    this.matFuelLiquid = new THREE.MeshPhysicalMaterial({
      color: 0xf59e0b,
      transmission: 0.75,
      opacity: 0.85,
      transparent: true,
      roughness: 0.15,
      ior: 1.4,
      emissive: 0x78350f,
      emissiveIntensity: 0.25
    });

    // Coolant Blue (Cold) & Red (Hot)
    this.matCoolantBlue = new THREE.MeshStandardMaterial({
      color: 0x00d2ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    this.matCoolantRed = new THREE.MeshStandardMaterial({
      color: 0xff3344,
      emissive: 0xcc1122,
      emissiveIntensity: 0.5,
      roughness: 0.3
    });

    // Transparent Tubes / Lines
    this.matClearTube = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transmission: 0.85,
      opacity: 0.6,
      transparent: true,
      roughness: 0.2,
      ior: 1.35
    });

    // Pump Metals
    this.matGoldBrass = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2
    });

    this.matAluminum = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.8,
      roughness: 0.3
    });
  }

  // 1. FUEL SYSTEM (Rear Tank, Fuel Pump, Lines, Rail, Injectors)
  buildFuelSystem() {
    // Fuel Tank: located at rear chassis (Z ~ -1.35, Y ~ 0.28)
    const tankWidth = 0.58;
    const tankHeight = 0.42;
    const tankLength = 0.45;

    // Outer Glass Tank
    const tankGeo = new THREE.BoxGeometry(tankWidth, tankHeight, tankLength);
    const tankMesh = new THREE.Mesh(tankGeo, this.matClearGlass);
    tankMesh.position.set(-0.15, 0.26, -1.35);
    this.fuelGroup.add(tankMesh);

    // Internal Liquid Volume
    const liquidGeo = new THREE.BoxGeometry(tankWidth * 0.94, tankHeight * 0.92, tankLength * 0.94);
    this.fuelLiquidMesh = new THREE.Mesh(liquidGeo, this.matFuelLiquid);
    this.fuelLiquidMesh.position.set(-0.15, 0.26, -1.35);
    this.fuelGroup.add(this.fuelLiquidMesh);

    // Fuel Pump Assembly: mounted beside/inside the tank
    const pumpGroup = new THREE.Group();
    pumpGroup.position.set(0.24, 0.26, -1.35);

    // Cylindrical Pump Housing
    const pumpHousingGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 24);
    const pumpHousing = new THREE.Mesh(pumpHousingGeo, this.matClearGlass);
    pumpGroup.add(pumpHousing);

    // Internal Impeller / Rotor
    const impellerGroup = new THREE.Group();
    const bladeGeo = new THREE.BoxGeometry(0.012, 0.14, 0.08);
    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(bladeGeo, this.matGoldBrass);
      blade.rotation.y = (b * Math.PI) / 3;
      impellerGroup.add(blade);
    }
    pumpGroup.add(impellerGroup);
    this.fuelPumpImpeller = impellerGroup;

    // Pump Top Pressure Cap & LED Ring
    const capGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.03, 24);
    const capMesh = new THREE.Mesh(capGeo, this.matAluminum);
    capMesh.position.y = 0.12;
    pumpGroup.add(capMesh);

    const ledRingGeo = new THREE.TorusGeometry(0.06, 0.008, 12, 32);
    ledRingGeo.rotateX(Math.PI / 2);
    this.matPumpLed = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const ledRing = new THREE.Mesh(ledRingGeo, this.matPumpLed);
    ledRing.position.y = 0.13;
    pumpGroup.add(ledRing);

    this.fuelGroup.add(pumpGroup);

    // Pressurized Fuel Delivery Line (Spline Curve from pump to front rail)
    const fuelCurvePoints = [
      new THREE.Vector3(0.24, 0.35, -1.35),
      new THREE.Vector3(0.20, 0.10, -1.0),
      new THREE.Vector3(0.12, 0.08, 0.0),
      new THREE.Vector3(0.08, 0.22, 0.6),
      new THREE.Vector3(0.04, 0.42, 0.85) // Fuel rail inlet
    ];
    this.fuelSpline = new THREE.CatmullRomCurve3(fuelCurvePoints);

    // Tube Mesh
    const tubeGeo = new THREE.TubeGeometry(this.fuelSpline, 64, 0.012, 12, false);
    const tubeMesh = new THREE.Mesh(tubeGeo, this.matClearTube);
    this.fuelGroup.add(tubeMesh);

    // Animated Fuel Fluid Particles (60 particles flowing along the spline)
    const particleCount = 70;
    const partGeo = new THREE.SphereGeometry(0.009, 8, 8);
    const partMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
    this.fuelParticleMesh = new THREE.InstancedMesh(partGeo, partMat, particleCount);
    this.fuelParticleData = [];

    const dummy = new THREE.Object3D();
    for (let p = 0; p < particleCount; p++) {
      const t = p / particleCount;
      this.fuelParticleData.push({ t, speed: 0.2 });
      const pos = this.fuelSpline.getPoint(t);
      dummy.position.copy(pos);
      dummy.updateMatrix();
      this.fuelParticleMesh.setMatrixAt(p, dummy.matrix);
    }
    this.fuelParticleMesh.instanceMatrix.needsUpdate = true;
    this.fuelGroup.add(this.fuelParticleMesh);

    // Fuel Rail & Injectors in Engine Bay
    const railGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.65, 16);
    railGeo.rotateX(Math.PI / 2);
    const railMesh = new THREE.Mesh(railGeo, this.matAluminum);
    railMesh.position.set(-0.06, 0.46, 0.85);
    this.fuelGroup.add(railMesh);

    // 6 Injectors with spray cones
    for (let j = 0; j < 6; j++) {
      const z = 0.85 + (j - 2.5) * 0.11;
      const injGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.04, 12);
      const injMesh = new THREE.Mesh(injGeo, this.matGoldBrass);
      injMesh.position.set(-0.06, 0.42, z);
      this.fuelGroup.add(injMesh);

      // Spray Cone (pulsing fuel mist)
      const coneGeo = new THREE.ConeGeometry(0.025, 0.05, 12, 1, true);
      const coneMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.0,
        side: THREE.DoubleSide
      });
      const coneMesh = new THREE.Mesh(coneGeo, coneMat);
      coneMesh.position.set(-0.04, 0.38, z);
      coneMesh.rotation.z = Math.PI;
      this.fuelGroup.add(coneMesh);

      this.fuelInjectors.push({
        index: j,
        coneMesh,
        coneMat
      });
    }
  }

  // 2. COOLING SYSTEM (Front Radiator, Fans, Water Pump, Coolant Lines)
  buildCoolingSystem() {
    // Radiator: at very front (Z ~ +1.8, Y ~ 0.28)
    const radWidth = 0.68;
    const radHeight = 0.40;
    const radThickness = 0.06;

    const radGroup = new THREE.Group();
    radGroup.position.set(0, 0.28, 1.75);

    // Core
    const coreGeo = new THREE.BoxGeometry(radWidth, radHeight, radThickness);
    const coreMesh = new THREE.Mesh(coreGeo, this.matAluminum);
    radGroup.add(coreMesh);

    // Dual Electric Fans mounted behind radiator
    for (let f = 0; f < 2; f++) {
      const fanX = (f === 0) ? -0.18 : 0.18;
      const fanGroup = new THREE.Group();
      fanGroup.position.set(fanX, 0, -0.04);

      // Shroud
      const shroudGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 24);
      shroudGeo.rotateX(Math.PI / 2);
      const shroudMesh = new THREE.Mesh(shroudGeo, new THREE.MeshStandardMaterial({ color: 0x111827 }));
      fanGroup.add(shroudMesh);

      // Blades
      const bladesGroup = new THREE.Group();
      const fanBladeGeo = new THREE.BoxGeometry(0.015, 0.24, 0.03);
      for (let b = 0; b < 5; b++) {
        const blade = new THREE.Mesh(fanBladeGeo, new THREE.MeshStandardMaterial({ color: 0x374151 }));
        blade.rotation.z = (b * Math.PI) / 2.5;
        bladesGroup.add(blade);
      }
      fanGroup.add(bladesGroup);
      this.radiatorFans.push(bladesGroup);
      radGroup.add(fanGroup);
    }

    this.coolantGroup.add(radGroup);

    // Water Pump (mounted front of engine block Z ~ 1.25, Y ~ 0.22)
    const waterPumpGroup = new THREE.Group();
    waterPumpGroup.position.set(0, 0.22, 1.25);

    const wpGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20);
    wpGeo.rotateX(Math.PI / 2);
    const wpMesh = new THREE.Mesh(wpGeo, this.matClearGlass);
    waterPumpGroup.add(wpMesh);

    // Water Pump Impeller
    const wpImpeller = new THREE.Group();
    const wpVaneGeo = new THREE.BoxGeometry(0.01, 0.09, 0.025);
    for (let v = 0; v < 4; v++) {
      const vane = new THREE.Mesh(wpVaneGeo, this.matAluminum);
      vane.rotation.z = (v * Math.PI) / 2;
      wpImpeller.add(vane);
    }
    waterPumpGroup.add(wpImpeller);
    this.waterPumpImpeller = wpImpeller;
    this.coolantGroup.add(waterPumpGroup);

    // Coolant Hoses:
    // Cold Line: Radiator bottom (-0.25, 0.12, 1.75) ➔ Water pump (0, 0.20, 1.25)
    const coldCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.25, 0.14, 1.72),
      new THREE.Vector3(-0.18, 0.10, 1.50),
      new THREE.Vector3(0.0, 0.18, 1.26)
    ]);
    const coldTube = new THREE.Mesh(new THREE.TubeGeometry(coldCurve, 32, 0.02, 12, false), this.matCoolantBlue);
    this.coolantGroup.add(coldTube);

    // Hot Line: Engine thermostat (0.05, 0.42, 1.15) ➔ Radiator top (+0.25, 0.42, 1.72)
    const hotCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.05, 0.42, 1.15),
      new THREE.Vector3(0.18, 0.44, 1.45),
      new THREE.Vector3(0.25, 0.42, 1.72)
    ]);
    const hotTube = new THREE.Mesh(new THREE.TubeGeometry(hotCurve, 32, 0.02, 12, false), this.matCoolantRed);
    this.coolantGroup.add(hotTube);
  }

  // 3. LUBRICATION / OIL SYSTEM
  buildOilSystem() {
    // Oil Sump Pan at bottom of engine (Z ~ 0.85, Y ~ 0.08)
    const panGeo = new THREE.BoxGeometry(0.28, 0.10, 0.65);
    const panMesh = new THREE.Mesh(panGeo, this.matClearGlass);
    panMesh.position.set(0, 0.06, 0.85);
    this.oilGroup.add(panMesh);

    // Internal Viscous Oil Level
    const oilFluidGeo = new THREE.BoxGeometry(0.26, 0.07, 0.63);
    const matOilFluid = new THREE.MeshPhysicalMaterial({
      color: 0xd97706,
      transmission: 0.6,
      opacity: 0.9,
      transparent: true,
      roughness: 0.2
    });
    const oilFluid = new THREE.Mesh(oilFluidGeo, matOilFluid);
    oilFluid.position.set(0, 0.05, 0.85);
    this.oilGroup.add(oilFluid);

    // Oil Filter
    const filterGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.10, 20);
    const filterMesh = new THREE.Mesh(filterGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.5, roughness: 0.3 }));
    filterMesh.position.set(-0.20, 0.14, 0.70);
    filterMesh.rotation.z = Math.PI / 3;
    this.oilGroup.add(filterMesh);
  }

  // 4. BRAKE HYDRAULICS
  buildBrakeHydraulics() {
    // Master Cylinder on Firewall (Z ~ 0.45, Y ~ 0.50, X ~ -0.30)
    const masterCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16), this.matClearGlass);
    masterCyl.position.set(-0.32, 0.48, 0.45);
    masterCyl.rotation.x = Math.PI / 2;
    this.brakesGroup.add(masterCyl);

    // Front & Rear Brake Lines
    const brakeFrontL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.45, 0.45),
      new THREE.Vector3(-0.45, 0.25, 0.75),
      new THREE.Vector3(-0.72, 0.22, 1.30)
    ]);
    const bfMesh = new THREE.Mesh(new THREE.TubeGeometry(brakeFrontL, 24, 0.006, 8, false), this.matClearTube);
    this.brakesGroup.add(bfMesh);

    const brakeRearL = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.32, 0.45, 0.45),
      new THREE.Vector3(-0.25, 0.12, -0.40),
      new THREE.Vector3(-0.72, 0.22, -1.30)
    ]);
    const brMesh = new THREE.Mesh(new THREE.TubeGeometry(brakeRearL, 32, 0.006, 8, false), this.matClearTube);
    this.brakesGroup.add(brMesh);
  }

  update(physics, dt, explodedFactor) {
    // 1. Fuel Tank Liquid Level & Sloshing
    if (this.fuelLiquidMesh) {
      const level = Math.max(0.02, physics.fuelLevel);
      this.fuelLiquidMesh.scale.y = level;
      // Adjust center y position as liquid drops
      this.fuelLiquidMesh.position.y = 0.26 - (1.0 - level) * 0.18;
      
      // Slosh wave ripple
      const slosh = Math.sin(Date.now() * 0.005) * 0.015 * (physics.speedKmh > 0 ? 1 : 0.2);
      this.fuelLiquidMesh.rotation.z = slosh;
    }

    // 2. High-Pressure Fuel Pump Rotation
    if (this.fuelPumpImpeller && physics.fuelPumpActive && physics.fuelRailPressure > 0.5) {
      // Spins at high speed when active
      this.fuelPumpImpeller.rotation.y += 24.0 * dt;
      if (this.matPumpLed) {
        this.matPumpLed.color.setHex(0x00ff88);
      }
    } else if (this.matPumpLed) {
      this.matPumpLed.color.setHex(0xef4444);
    }

    // 3. Fuel Fluid Particles Stream along line
    if (this.fuelParticleMesh && this.fuelSpline) {
      const flowRate = physics.fuelFlowRate; // L/h
      const speedMultiplier = (flowRate > 0) ? (0.2 + (flowRate / 40.0) * 1.5) : 0;
      const dummy = new THREE.Object3D();

      for (let p = 0; p < this.fuelParticleData.length; p++) {
        const item = this.fuelParticleData[p];
        if (physics.running || physics.starterActive) {
          item.t = (item.t + speedMultiplier * dt * 0.25) % 1.0;
        }
        const pos = this.fuelSpline.getPoint(item.t);
        dummy.position.copy(pos);
        dummy.updateMatrix();
        this.fuelParticleMesh.setMatrixAt(p, dummy.matrix);
      }
      this.fuelParticleMesh.instanceMatrix.needsUpdate = true;
    }

    // 4. Timed Fuel Injectors Spray Pulse
    const crankAngle = physics.crankAngle;
    for (let j = 0; j < this.fuelInjectors.length; j++) {
      const inj = this.fuelInjectors[j];
      const cylPhase = (crankAngle + j * (720 / 6)) % 720;
      // Spray pulse fires at end of exhaust stroke / early intake (700° - 40°)
      const isSpraying = physics.running && (cylPhase >= 680 || cylPhase <= 45);
      if (isSpraying) {
        inj.coneMat.opacity = 0.8;
      } else {
        inj.coneMat.opacity = Math.max(0, inj.coneMat.opacity - 0.2);
      }
    }

    // 5. Radiator Electric Fans Rotation
    if (physics.coolingFanActive && (physics.coolantTemp > 80.0 || physics.running)) {
      const fanSpeed = 15.0 + ((physics.coolantTemp - 80) / 30.0) * 25.0;
      for (let f = 0; f < this.radiatorFans.length; f++) {
        this.radiatorFans[f].rotation.z += fanSpeed * dt;
      }
    }

    // 6. Water Pump Impeller Rotation (coupled to RPM)
    if (this.waterPumpImpeller) {
      const wpSpeed = (physics.rpm / 60.0) * Math.PI * 2.0;
      this.waterPumpImpeller.rotation.z += wpSpeed * dt;
    }

    // 7. Exploded View Displacements
    this.fuelGroup.position.set(0, 0, -explodedFactor * 0.35);
    this.coolantGroup.position.set(0, 0, explodedFactor * 0.35);
    this.oilGroup.position.set(0, -explodedFactor * 0.25, 0);
  }

  setVisibility(subsystem, visible) {
    if (subsystem === 'fluids') {
      this.fuelGroup.visible = visible;
    } else if (subsystem === 'coolant') {
      this.coolantGroup.visible = visible;
    } else if (subsystem === 'oil') {
      this.oilGroup.visible = visible;
    } else if (subsystem === 'brakes') {
      this.brakesGroup.visible = visible;
    }
  }
}

