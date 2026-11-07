import * as THREE from 'three';

export class EngineModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Current engine layout
    this.currentKey = 'i6';
    this.cylinders = [];
    this.crankshaftGroup = null;
    this.camshaftsGroup = null;
    this.engineBlockMesh = null;
    this.exhaustManifoldMesh = null;
    this.timingBelt = null;

    // Materials cache
    this.initMaterials();

    // Build default
    this.buildEngine('i6');
  }

  initMaterials() {
    this.matBlock = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.2,
      roughness: 0.15,
      transmission: 0.82,
      transparent: true,
      opacity: 0.88,
      ior: 1.45,
      thickness: 1.2
    });

    this.matSteel = new THREE.MeshStandardMaterial({
      color: 0xcfd8dc,
      metalness: 0.9,
      roughness: 0.2
    });

    this.matPiston = new THREE.MeshStandardMaterial({
      color: 0xe0e6ed,
      metalness: 0.85,
      roughness: 0.25
    });

    this.matBronze = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.8,
      roughness: 0.3
    });

    this.matValve = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.3
    });

    this.matSparkCeramic = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2
    });

    this.matExhaust = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.6,
      roughness: 0.4,
      emissive: 0x000000
    });

    this.matFlame = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });
  }

  buildEngine(key) {
    this.currentKey = key;
    // Clear existing
    while (this.group.children.length > 0) {
      const obj = this.group.children[0];
      this.group.remove(obj);
    }
    this.cylinders = [];

    // Engine position inside car bay: front mounted (Z ~ +0.8, Y ~ 0.2)
    this.group.position.set(0, 0.25, 0.85);

    const numCyl = (key === 'i6') ? 6 : (key === 'v8') ? 8 : (key === 'v12') ? 12 : 4;
    const isV = (key === 'v8' || key === 'v12');
    const isBoxer = (key === 'boxer4');

    const crankRadius = 0.048; // stroke ~ 96mm (radius = 48mm)
    const rodLength = 0.145;   // 145mm rod
    const boreRadius = 0.042;  // 84mm bore
    const cylSpacing = 0.11;   // spacing along crank axis (Z)

    // 1. Crankshaft & Flywheel Group
    this.crankshaftGroup = new THREE.Group();
    const crankLength = (isV || isBoxer ? numCyl / 2 : numCyl) * cylSpacing + 0.12;

    // Main center shaft
    const mainShaftGeo = new THREE.CylinderGeometry(0.018, 0.018, crankLength, 24);
    mainShaftGeo.rotateX(Math.PI / 2);
    const mainShaft = new THREE.Mesh(mainShaftGeo, this.matSteel);
    this.crankshaftGroup.add(mainShaft);

    // Flywheel at rear
    const flywheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.035, 36);
    flywheelGeo.rotateX(Math.PI / 2);
    const flywheel = new THREE.Mesh(flywheelGeo, this.matSteel);
    flywheel.position.set(0, 0, -crankLength / 2 - 0.02);
    this.crankshaftGroup.add(flywheel);

    // Front Harmonic Balancer Pulley
    const pulleyGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.025, 32);
    pulleyGeo.rotateX(Math.PI / 2);
    const pulley = new THREE.Mesh(pulleyGeo, this.matSteel);
    pulley.position.set(0, 0, crankLength / 2 + 0.02);
    this.crankshaftGroup.add(pulley);

    this.group.add(this.crankshaftGroup);

    // 2. Engine Block (Transparent casing)
    const blockWidth = isV ? 0.48 : isBoxer ? 0.65 : 0.32;
    const blockHeight = 0.38;
    const blockLength = crankLength + 0.08;
    const blockGeo = new THREE.BoxGeometry(blockWidth, blockHeight, blockLength);
    this.engineBlockMesh = new THREE.Mesh(blockGeo, this.matBlock);
    this.engineBlockMesh.position.set(0, 0.08, 0);
    this.group.add(this.engineBlockMesh);

    // 3. Cylinders, Pistons, Connecting Rods, Valves, Spark Plugs
    const countZ = isV || isBoxer ? numCyl / 2 : numCyl;

    for (let i = 0; i < numCyl; i++) {
      let zIdx = i;
      let bankAngle = 0; // inline
      let bankSign = 0;

      if (isV) {
        zIdx = Math.floor(i / 2);
        bankSign = (i % 2 === 0) ? -1 : 1;
        bankAngle = (key === 'v8') ? (Math.PI / 4) * bankSign : (Math.PI / 6) * bankSign; // 90 deg or 60 deg
      } else if (isBoxer) {
        zIdx = Math.floor(i / 2);
        bankSign = (i % 2 === 0) ? -1 : 1;
        bankAngle = (Math.PI / 2) * bankSign; // 180 deg flat
      }

      const zPos = (zIdx - (countZ - 1) / 2) * cylSpacing;

      // Crank pin & counterweight on crankshaft
      const pinGroup = new THREE.Group();
      pinGroup.position.set(0, 0, zPos);
      
      // Counterweight
      const counterWeightGeo = new THREE.BoxGeometry(0.085, 0.045, 0.022);
      const counterWeight = new THREE.Mesh(counterWeightGeo, this.matSteel);
      counterWeight.position.set(0, -crankRadius * 0.9, 0);
      pinGroup.add(counterWeight);

      // Crank journal pin
      const pinGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.024, 16);
      pinGeo.rotateX(Math.PI / 2);
      const pin = new THREE.Mesh(pinGeo, this.matBronze);
      pin.position.set(0, crankRadius, 0);
      pinGroup.add(pin);

      this.crankshaftGroup.add(pinGroup);

      // Connecting Rod
      const rodGroup = new THREE.Group();
      const rodGeo = new THREE.BoxGeometry(0.018, rodLength, 0.015);
      const rodMesh = new THREE.Mesh(rodGeo, this.matSteel);
      rodMesh.position.set(0, rodLength / 2, 0);
      rodGroup.add(rodMesh);
      this.group.add(rodGroup);

      // Piston Assembly
      const pistonGroup = new THREE.Group();
      const pistonGeo = new THREE.CylinderGeometry(boreRadius, boreRadius, 0.055, 24);
      const pistonMesh = new THREE.Mesh(pistonGeo, this.matPiston);
      pistonGroup.add(pistonMesh);

      // Spark Plug & Flame Light
      const sparkGroup = new THREE.Group();
      const sparkBodyGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.045, 12);
      const sparkBody = new THREE.Mesh(sparkBodyGeo, this.matSparkCeramic);
      sparkGroup.add(sparkBody);

      const sparkTipGeo = new THREE.SphereGeometry(0.005, 8, 8);
      const matSparkTip = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const sparkTip = new THREE.Mesh(sparkTipGeo, matSparkTip);
      sparkTip.position.y = -0.024;
      sparkGroup.add(sparkTip);

      const sparkLight = new THREE.PointLight(0x00e5ff, 0, 0.5);
      sparkLight.position.y = -0.025;
      sparkGroup.add(sparkLight);

      // Combustion Fireball
      const flameGeo = new THREE.SphereGeometry(boreRadius * 0.85, 16, 16);
      const flameMesh = new THREE.Mesh(flameGeo, this.matFlame.clone());
      flameMesh.scale.set(1, 0.4, 1);
      
      const flameLight = new THREE.PointLight(0xff6600, 0, 0.8);
      flameMesh.add(flameLight);

      // Intake & Exhaust Valves
      const valveGroup = new THREE.Group();
      const valveGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.065, 12);
      
      const intakeValve = new THREE.Mesh(valveGeo, this.matValve);
      intakeValve.position.set(-0.02, 0, 0);
      valveGroup.add(intakeValve);

      const exhaustValve = new THREE.Mesh(valveGeo, this.matValve);
      exhaustValve.position.set(0.02, 0, 0);
      valveGroup.add(exhaustValve);

      // Position spark, flame, and valves at cylinder head
      const headDist = crankRadius + rodLength + 0.04;
      const headX = Math.sin(bankAngle) * headDist;
      const headY = Math.cos(bankAngle) * headDist;

      sparkGroup.position.set(headX, headY + 0.03, zPos);
      sparkGroup.rotation.z = -bankAngle;
      this.group.add(sparkGroup);

      flameMesh.position.set(headX, headY - 0.015, zPos);
      this.group.add(flameMesh);

      valveGroup.position.set(headX, headY + 0.02, zPos);
      valveGroup.rotation.z = -bankAngle;
      this.group.add(valveGroup);

      this.group.add(pistonGroup);

      this.cylinders.push({
        index: i,
        zPos,
        bankAngle,
        pinGroup,
        rodGroup,
        pistonGroup,
        sparkGroup,
        sparkLight,
        sparkTip,
        flameMesh,
        flameLight,
        intakeValve,
        exhaustValve,
        valveGroup,
        crankRadius,
        rodLength,
        headDist,
        headX,
        headY
      });
    }

    // 4. Exhaust Headers / Manifold with dynamic thermal heat glow
    this.buildExhaustManifold(countZ, cylSpacing, isV);
  }

  buildExhaustManifold(countZ, cylSpacing, isV) {
    const manifoldGroup = new THREE.Group();
    const curvePoints = [];
    
    // Header runner tubes
    for (let i = 0; i < countZ; i++) {
      const z = (i - (countZ - 1) / 2) * cylSpacing;
      const runnerGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12);
      runnerGeo.rotateZ(Math.PI / 3);
      const runner = new THREE.Mesh(runnerGeo, this.matExhaust);
      runner.position.set(0.18, 0.12, z);
      manifoldGroup.add(runner);
    }

    // Collector pipe running to downpipe
    const collectorGeo = new THREE.CylinderGeometry(0.03, 0.03, countZ * cylSpacing + 0.1, 16);
    collectorGeo.rotateX(Math.PI / 2);
    const collector = new THREE.Mesh(collectorGeo, this.matExhaust);
    collector.position.set(0.25, 0.06, 0);
    manifoldGroup.add(collector);

    // Downpipe bend
    const downpipeGeo = new THREE.CylinderGeometry(0.032, 0.032, 0.35, 16);
    downpipeGeo.rotateZ(-Math.PI / 4);
    const downpipe = new THREE.Mesh(downpipeGeo, this.matExhaust);
    downpipe.position.set(0.28, -0.06, -countZ * cylSpacing / 2);
    manifoldGroup.add(downpipe);

    this.exhaustManifoldMesh = manifoldGroup;
    this.group.add(this.exhaustManifoldMesh);
  }

  update(physics, explodedFactor) {
    const crankAngleDeg = physics.crankAngle; // 0 to 720
    const crankAngleRad = (crankAngleDeg * Math.PI) / 180.0;

    // 1. Rotate Crankshaft
    if (this.crankshaftGroup) {
      this.crankshaftGroup.rotation.z = crankAngleRad;
    }

    // 2. Animate Cylinders, Connecting Rods, Pistons, Valves, Ignition
    const cfg = physics.cfg;
    const offsets = cfg.crankOffsets || [];
    const pistonPhases = cfg.pistonOffsets || [];

    for (let i = 0; i < this.cylinders.length; i++) {
      const cyl = this.cylinders[i];
      const crankOffsetDeg = offsets[i % offsets.length] || 0;
      const phaseOffset = (pistonPhases[i % pistonPhases.length] || 0) * (720.0 / cfg.cylinders);
      
      // Local cycle angle for this cylinder (0 to 720 deg)
      const cylCycleDeg = (crankAngleDeg + phaseOffset) % 720.0;
      const cylCrankAngleRad = ((crankAngleDeg + crankOffsetDeg) * Math.PI) / 180.0;

      // Kinematics: Crank pin position in 2D (perpendicular to crank axis Z)
      const r = cyl.crankRadius;
      const L = cyl.rodLength;

      // Pin position rotated by crankshaft
      const pinLocalX = -Math.sin(cylCrankAngleRad) * r;
      const pinLocalY = Math.cos(cylCrankAngleRad) * r;

      // Piston moves along cylinder bank axis
      // Piston displacement from crank center along bank axis:
      // s(theta) = r * cos(theta_rel) + sqrt(L^2 - r^2 * sin^2(theta_rel))
      const thetaRel = cylCrankAngleRad - cyl.bankAngle;
      const pistonDist = r * Math.cos(thetaRel) + Math.sqrt(Math.max(0.001, L * L - r * r * Math.sin(thetaRel) * Math.sin(thetaRel)));

      const pistonX = Math.sin(cyl.bankAngle) * pistonDist;
      const pistonY = Math.cos(cyl.bankAngle) * pistonDist;

      // Exploded view translation vector
      const explodeOffset = explodedFactor * 0.25;
      const explodeX = Math.sin(cyl.bankAngle) * explodeOffset;
      const explodeY = Math.cos(cyl.bankAngle) * explodeOffset;

      // Update Piston
      cyl.pistonGroup.position.set(pistonX + explodeX, pistonY + explodeY, cyl.zPos);
      cyl.pistonGroup.rotation.z = -cyl.bankAngle;

      // Update Connecting Rod
      cyl.rodGroup.position.set(pinLocalX, pinLocalY, cyl.zPos);
      // Rod angle pointing toward piston pin
      const dx = (pistonX + explodeX) - pinLocalX;
      const dy = (pistonY + explodeY) - pinLocalY;
      const rodAngle = Math.atan2(dx, dy);
      cyl.rodGroup.rotation.z = -rodAngle;

      // 3. Valves lift & timing
      // Intake stroke: 0° to 180°
      let intakeLift = 0;
      if (cylCycleDeg >= 0 && cylCycleDeg < 180) {
        intakeLift = Math.sin((cylCycleDeg / 180.0) * Math.PI) * 0.012;
      }
      cyl.intakeValve.position.y = -intakeLift;

      // Exhaust stroke: 540° to 720°
      let exhaustLift = 0;
      if (cylCycleDeg >= 540 && cylCycleDeg < 720) {
        exhaustLift = Math.sin(((cylCycleDeg - 540) / 180.0) * Math.PI) * 0.012;
      }
      cyl.exhaustValve.position.y = -exhaustLift;

      // 4. Spark Plug Flash & Combustion Flame
      // Power stroke ignition around 355° - 375°
      const isFiring = (cylCycleDeg >= 355 && cylCycleDeg <= 375 && physics.running);
      if (isFiring) {
        cyl.sparkLight.intensity = 1.8;
        cyl.sparkTip.material.color.setHex(0x00ffff);
        
        cyl.flameMesh.material.opacity = 0.85;
        cyl.flameLight.intensity = 2.5;
        const flameScale = 1.0 + Math.sin(((cylCycleDeg - 355) / 20.0) * Math.PI) * 0.3;
        cyl.flameMesh.scale.set(flameScale, 0.4 * flameScale, flameScale);
      } else {
        // Fade out flame
        cyl.sparkLight.intensity = 0;
        cyl.sparkTip.material.color.setHex(0x334155);
        
        if (cyl.flameMesh.material.opacity > 0) {
          cyl.flameMesh.material.opacity = Math.max(0, cyl.flameMesh.material.opacity - 0.15);
          cyl.flameLight.intensity = Math.max(0, cyl.flameLight.intensity - 0.4);
        }
      }

      // Exploded offsets for head components
      cyl.sparkGroup.position.set(cyl.headX + explodeX * 1.6, cyl.headY + 0.03 + explodeY * 1.6, cyl.zPos);
      cyl.valveGroup.position.set(cyl.headX + explodeX * 1.5, cyl.headY + 0.02 + explodeY * 1.5, cyl.zPos);
      cyl.flameMesh.position.set(cyl.headX + explodeX * 1.2, cyl.headY - 0.015 + explodeY * 1.2, cyl.zPos);
    }

    // 5. Thermal Heat Glow on Exhaust Manifold
    // Transition emissive color from dark brown to cherry red (0xff3300) and bright orange (0xffaa00)
    if (this.exhaustManifoldMesh) {
      const exhRatio = Math.max(0, Math.min(1.0, (physics.exhaustTemp - 80) / 720.0));
      this.exhaustManifoldMesh.traverse(child => {
        if (child.isMesh && child.material) {
          if (exhRatio > 0.05) {
            child.material.emissive.setRGB(exhRatio * 1.0, exhRatio * 0.35, exhRatio * 0.05);
          } else {
            child.material.emissive.setRGB(0, 0, 0);
          }
        }
      });
    }

    // Exploded View on Block & Manifold
    if (this.engineBlockMesh) {
      this.engineBlockMesh.position.y = 0.08 + explodedFactor * 0.1;
    }
    if (this.exhaustManifoldMesh) {
      this.exhaustManifoldMesh.position.x = explodedFactor * 0.22;
    }
  }

  setVisibility(subsystem, visible) {
    if (subsystem === 'engine') {
      this.group.visible = visible;
    } else if (subsystem === 'exhaust' && this.exhaustManifoldMesh) {
      this.exhaustManifoldMesh.visible = visible;
    }
  }
}

