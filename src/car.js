import * as THREE from 'three';

export class CarModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Sub-components
    this.chassisGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.wheelsGroup = new THREE.Group();
    this.drivetrainGroup = new THREE.Group();
    this.interiorGroup = new THREE.Group();
    this.dynoRollersGroup = new THREE.Group();

    this.group.add(this.chassisGroup);
    this.group.add(this.bodyGroup);
    this.group.add(this.wheelsGroup);
    this.group.add(this.drivetrainGroup);
    this.group.add(this.interiorGroup);
    this.group.add(this.dynoRollersGroup);

    // Dynamic meshes
    this.bodyMeshes = [];
    this.wheels = [];
    this.brakeDiscs = [];
    this.driveShaft = null;
    this.gearboxGears = [];
    this.exhaustTips = [];
    this.dynoRollers = [];
    this.steeringWheel = null;

    this.initMaterials();
    this.buildChassis();
    this.buildDrivetrain();
    this.buildWheelsAndBrakes();
    this.buildCockpit();
    this.buildRealisticTransparentBody();
    this.buildDynoRollers();
  }

  initMaterials() {
    // 1. Ultra-Clear Photorealistic Glass Material (Default)
    this.matBodyGlass = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.08,
      metalness: 0.05,
      roughness: 0.04,
      transmission: 0.92,
      transparent: true,
      opacity: 0.94,
      ior: 1.52,
      thickness: 1.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      side: THREE.DoubleSide
    });

    // 2. Holographic X-Ray Material
    this.matBodyHolo = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x0088cc,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.45,
      wireframe: false,
      side: THREE.DoubleSide
    });

    // 3. Wireframe Material
    this.matBodyWire = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });

    // 4. Solid Carbon / Deep Showroom Metallic Paint
    this.matBodySolid = new THREE.MeshStandardMaterial({
      color: 0x0a1120,
      metalness: 0.88,
      roughness: 0.15,
      side: THREE.DoubleSide
    });

    // Carbon Fiber Trim (Splitter, Diffuser, Spoiler)
    this.matCarbon = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.45,
      roughness: 0.35,
      side: THREE.DoubleSide
    });

    // Chassis tubular steel
    this.matChassis = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.85,
      roughness: 0.25
    });

    // Alloy rims
    this.matRim = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      metalness: 0.95,
      roughness: 0.15
    });

    // Rubber tires
    this.matTire = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.08,
      roughness: 0.85
    });

    // Brake discs with dynamic thermal glow
    this.matBrakeDisc = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.9,
      roughness: 0.25,
      emissive: 0x000000
    });

    // Red Brembo-style brake calipers
    this.matCaliper = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      metalness: 0.6,
      roughness: 0.25
    });

    // Transmission casing (Semi-transparent)
    this.matTransCasing = new THREE.MeshPhysicalMaterial({
      color: 0x64748b,
      transmission: 0.84,
      transparent: true,
      opacity: 0.85,
      roughness: 0.18
    });

    // LED Headlight & DRL Glow
    this.matHeadlightLED = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00e5ff,
      emissiveIntensity: 2.2
    });

    // OLED Taillight Glow
    this.matTaillightLED = new THREE.MeshStandardMaterial({
      color: 0xff0033,
      emissive: 0xff0033,
      emissiveIntensity: 2.5
    });

    this.currentBodyMaterial = this.matBodyGlass;
  }

  // 1. SPACEFRAME CHASSIS & SUBFRAMES
  buildChassis() {
    const pipeMat = this.matChassis;

    // Longitudinal main frame rails
    for (let side of [-0.65, 0.65]) {
      const railGeo = new THREE.CylinderGeometry(0.024, 0.024, 3.85, 12);
      railGeo.rotateX(Math.PI / 2);
      const rail = new THREE.Mesh(railGeo, pipeMat);
      rail.position.set(side, 0.16, 0);
      rail.userData = { componentId: 'chassis', name: 'Main Chassis Frame Rail' };
      this.chassisGroup.add(rail);

      // Upper sill rail
      const upperRail = new THREE.Mesh(railGeo, pipeMat);
      upperRail.position.set(side, 0.38, 0);
      upperRail.userData = { componentId: 'chassis', name: 'Upper Sill Structural Member' };
      this.chassisGroup.add(upperRail);
    }

    // Cross-members
    const crossZ = [-1.6, -1.0, -0.3, 0.4, 1.1, 1.7];
    for (let z of crossZ) {
      const crossGeo = new THREE.CylinderGeometry(0.022, 0.022, 1.3, 12);
      crossGeo.rotateZ(Math.PI / 2);
      const cross = new THREE.Mesh(crossGeo, pipeMat);
      cross.position.set(0, 0.16, z);
      cross.userData = { componentId: 'chassis', name: 'Torsional Cross-Member' };
      this.chassisGroup.add(cross);
    }

    // Roll Cage / Roof Arch
    for (let side of [-0.55, 0.55]) {
      const aPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.85, 12), pipeMat);
      aPillar.position.set(side, 0.62, 0.2);
      aPillar.rotation.x = -Math.PI / 4;
      this.chassisGroup.add(aPillar);

      const bPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.6, 12), pipeMat);
      bPillar.position.set(side, 0.65, -0.4);
      this.chassisGroup.add(bPillar);

      const cPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.95, 12), pipeMat);
      cPillar.position.set(side, 0.58, -1.05);
      cPillar.rotation.x = Math.PI / 3.5;
      this.chassisGroup.add(cPillar);
    }
  }

  // 2. DRIVETRAIN (Gearbox, Rotating Driveshaft, Differential)
  buildDrivetrain() {
    // Gearbox Housing
    const gbGeo = new THREE.BoxGeometry(0.26, 0.26, 0.45);
    const gbMesh = new THREE.Mesh(gbGeo, this.matTransCasing);
    gbMesh.position.set(0, 0.22, 0.32);
    gbMesh.userData = { componentId: 'gearbox', name: '6-Speed Manual Transmission' };
    this.drivetrainGroup.add(gbMesh);

    // Internal Meshing Gears
    for (let g = 0; g < 4; g++) {
      const gearGeo = new THREE.CylinderGeometry(0.06 + (g % 2) * 0.02, 0.06 + (g % 2) * 0.02, 0.025, 20);
      gearGeo.rotateX(Math.PI / 2);
      const gearMesh = new THREE.Mesh(gearGeo, this.matRim);
      gearMesh.position.set(0, 0.22, 0.45 - g * 0.08);
      gearMesh.userData = { componentId: 'gearbox', name: `Gearset Ratio Pair #${g + 1}` };
      this.drivetrainGroup.add(gearMesh);
      this.gearboxGears.push(gearMesh);
    }

    // Center Propeller Driveshaft
    const shaftLength = 1.45;
    const shaftGeo = new THREE.CylinderGeometry(0.022, 0.022, shaftLength, 16);
    shaftGeo.rotateX(Math.PI / 2);
    this.driveShaft = new THREE.Mesh(shaftGeo, this.matRim);
    this.driveShaft.position.set(0, 0.20, -0.62);
    this.driveShaft.userData = { componentId: 'driveshaft', name: 'Carbon-Fiber Propeller Driveshaft' };
    this.drivetrainGroup.add(this.driveShaft);

    // Rear Differential
    const diffGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const diffMesh = new THREE.Mesh(diffGeo, this.matChassis);
    diffMesh.position.set(0, 0.20, -1.35);
    diffMesh.userData = { componentId: 'diff', name: 'Limited-Slip Rear Differential (LSD)' };
    this.drivetrainGroup.add(diffMesh);

    // Rear Half-shafts to left and right wheels
    const axGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.65, 12);
    axGeo.rotateZ(Math.PI / 2);
    const axLeft = new THREE.Mesh(axGeo, this.matRim);
    axLeft.position.set(-0.45, 0.20, -1.35);
    this.drivetrainGroup.add(axLeft);

    const axRight = new THREE.Mesh(axGeo, this.matRim);
    axRight.position.set(0.45, 0.20, -1.35);
    this.drivetrainGroup.add(axRight);
  }

  // 3. WHEELS, TIRES, SUSPENSION & BRAKE ROTORS
  buildWheelsAndBrakes() {
    const wheelPositions = [
      { x: -0.80, y: 0.28, z: 1.25, isFront: true, isLeft: true },  // Front Left
      { x: 0.80, y: 0.28, z: 1.25, isFront: true, isLeft: false },  // Front Right
      { x: -0.80, y: 0.28, z: -1.35, isFront: false, isLeft: true }, // Rear Left
      { x: 0.80, y: 0.28, z: -1.35, isFront: false, isLeft: false } // Rear Right
    ];

    const wheelRadius = 0.33;
    const wheelWidth = 0.24;

    for (let wp of wheelPositions) {
      const wheelHub = new THREE.Group();
      wheelHub.position.set(wp.x, wp.y, wp.z);

      // Rotating Wheel Assembly
      const rotatingPart = new THREE.Group();

      // Rubber Tire with tread groove profile
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 32);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, this.matTire);
      tireMesh.userData = { componentId: 'wheels', name: 'High-Performance Michelin Pilot Sport Tire' };
      rotatingPart.add(tireMesh);

      // Alloy Rim
      const rimGeo = new THREE.CylinderGeometry(wheelRadius * 0.72, wheelRadius * 0.72, wheelWidth * 1.02, 24);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.matRim);
      rotatingPart.add(rimMesh);

      // Rim Spokes (5 twin-spokes)
      for (let s = 0; s < 5; s++) {
        const spokeGeo = new THREE.BoxGeometry(0.024, wheelRadius * 1.32, wheelWidth * 0.75);
        const spoke = new THREE.Mesh(spokeGeo, this.matRim);
        spoke.rotation.x = (s * Math.PI) / 2.5;
        rotatingPart.add(spoke);
      }

      // Ventilated Brake Disc (rotates with wheel)
      const discGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.02, 28);
      discGeo.rotateZ(Math.PI / 2);
      const discMesh = new THREE.Mesh(discGeo, this.matBrakeDisc.clone());
      discMesh.position.x = wp.isLeft ? 0.06 : -0.06;
      discMesh.userData = { componentId: 'brakes', name: '380mm Ventilated Carbon-Ceramic Rotor' };
      rotatingPart.add(discMesh);
      this.brakeDiscs.push(discMesh);

      wheelHub.add(rotatingPart);

      // Fixed Brake Caliper (stationary on hub)
      const calGeo = new THREE.BoxGeometry(0.07, 0.12, 0.095);
      const calMesh = new THREE.Mesh(calGeo, this.matCaliper);
      calMesh.position.set(wp.isLeft ? 0.06 : -0.06, 0.12, 0);
      calMesh.userData = { componentId: 'brakes', name: 'Brembo 6-Piston Monobloc Brake Caliper' };
      wheelHub.add(calMesh);

      // Coilover Suspension Spring & Damper
      const shockGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 12);
      const shock = new THREE.Mesh(shockGeo, this.matChassis);
      shock.position.set(wp.isLeft ? 0.12 : -0.12, 0.18, 0);
      shock.rotation.z = wp.isLeft ? -0.2 : 0.2;
      wheelHub.add(shock);

      this.wheelsGroup.add(wheelHub);
      this.wheels.push({
        hub: wheelHub,
        rotating: rotatingPart,
        isFront: wp.isFront,
        isLeft: wp.isLeft
      });
    }
  }

  // 4. INTERIOR COCKPIT
  buildCockpit() {
    // 2 Racing Bucket Seats
    for (let side of [-0.32, 0.32]) {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(side, 0.32, -0.15);

      const baseGeo = new THREE.BoxGeometry(0.38, 0.10, 0.42);
      const base = new THREE.Mesh(baseGeo, this.matTire);
      seatGroup.add(base);

      const backGeo = new THREE.BoxGeometry(0.38, 0.55, 0.09);
      const back = new THREE.Mesh(backGeo, this.matTire);
      back.position.set(0, 0.28, -0.20);
      back.rotation.x = -0.2;
      seatGroup.add(back);

      this.interiorGroup.add(seatGroup);
    }

    // Dashboard & Center Console
    const dashGeo = new THREE.BoxGeometry(1.0, 0.22, 0.32);
    const dash = new THREE.Mesh(dashGeo, this.matTire);
    dash.position.set(0, 0.55, 0.35);
    dash.userData = { componentId: 'cockpit', name: 'Digital Cockpit & Dashboard' };
    this.interiorGroup.add(dash);

    // Steering Wheel on driver side (Left)
    const steerGeo = new THREE.TorusGeometry(0.12, 0.016, 12, 28);
    const steer = new THREE.Mesh(steerGeo, this.matRim);
    steer.position.set(-0.32, 0.65, 0.18);
    steer.rotation.x = 0.5;
    steer.userData = { componentId: 'cockpit', name: 'Alcantara Racing Steering Wheel' };
    this.interiorGroup.add(steer);
    this.steeringWheel = steer;
  }

  // 5. HIGH-FIDELITY SCULPTED TRANSPARENT CAR BODY
  buildRealisticTransparentBody() {
    const mat = this.currentBodyMaterial;
    const carbon = this.matCarbon;

    // Helper to register mesh for transparency switching
    const addBodyPart = (mesh, name = 'Body Panel') => {
      mesh.userData = { componentId: 'body', name };
      this.bodyGroup.add(mesh);
      this.bodyMeshes.push(mesh);
      return mesh;
    };

    // A. NOSE CONE & AERODYNAMIC HOOD
    // Swept sloping hood
    const hoodGeo = new THREE.CylinderGeometry(0.66, 0.72, 1.25, 32, 1, false, 0, Math.PI);
    hoodGeo.rotateX(Math.PI / 2);
    hoodGeo.rotateZ(Math.PI);
    hoodGeo.scale(1.0, 0.32, 1.0);
    const hoodMesh = new THREE.Mesh(hoodGeo, mat);
    hoodMesh.position.set(0, 0.44, 1.15);
    addBodyPart(hoodMesh, 'Aerodynamic Front Hood');

    // Dual Hood Air Extraction Vents (Recessed channels)
    for (let side of [-0.22, 0.22]) {
      const ventGeo = new THREE.BoxGeometry(0.12, 0.02, 0.38);
      const vent = new THREE.Mesh(ventGeo, carbon);
      vent.position.set(side, 0.54, 1.12);
      vent.rotation.x = 0.1;
      this.bodyGroup.add(vent);
    }

    // Front Bumper Fascia & Central Radiator Air Intake
    const bumperGeo = new THREE.BoxGeometry(1.58, 0.26, 0.42);
    const bumper = new THREE.Mesh(bumperGeo, mat);
    bumper.position.set(0, 0.25, 1.84);
    addBodyPart(bumper, 'Front Bumper Fascia');

    // Radiator Intake Grille Mesh
    const grilleGeo = new THREE.BoxGeometry(0.95, 0.16, 0.04);
    const grille = new THREE.Mesh(grilleGeo, new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 }));
    grille.position.set(0, 0.22, 2.05);
    this.bodyGroup.add(grille);

    // Carbon Fiber Front Splitter with Aerodynamic Endplate Winglets
    const splitterGeo = new THREE.BoxGeometry(1.68, 0.035, 0.45);
    const splitter = new THREE.Mesh(splitterGeo, carbon);
    splitter.position.set(0, 0.12, 1.95);
    this.bodyGroup.add(splitter);

    // Front Canards / Winglets
    for (let side of [-0.84, 0.84]) {
      const canardGeo = new THREE.BoxGeometry(0.04, 0.14, 0.22);
      const canard = new THREE.Mesh(canardGeo, carbon);
      canard.position.set(side, 0.19, 1.95);
      this.bodyGroup.add(canard);
    }

    // LED Projector Headlight Assemblies with Cyan DRL Eyebrows
    for (let side of [-0.62, 0.62]) {
      // Headlight Housing Lens
      const hlGeo = new THREE.BoxGeometry(0.24, 0.08, 0.28);
      hlGeo.rotateY(side > 0 ? -0.25 : 0.25);
      const hl = new THREE.Mesh(hlGeo, this.matHeadlightLED);
      hl.position.set(side, 0.42, 1.78);
      this.bodyGroup.add(hl);

      // Projector Bulb Light
      const headLightSource = new THREE.SpotLight(0x00e5ff, 1.2, 12, Math.PI / 6, 0.3);
      headLightSource.position.set(side, 0.42, 1.85);
      headLightSource.target.position.set(side * 0.8, 0.2, 8.0);
      this.bodyGroup.add(headLightSource);
      this.bodyGroup.add(headLightSource.target);
    }

    // B. GREENHOUSE / COCKPIT CANOPY (Curved Windshield & Roof)
    // Panoramic Curved Windshield
    const windGeo = new THREE.CylinderGeometry(0.65, 0.70, 0.88, 32, 1, false, 0, Math.PI);
    windGeo.rotateX(Math.PI / 2);
    windGeo.rotateZ(Math.PI);
    windGeo.scale(0.96, 0.45, 1.0);
    const wind = new THREE.Mesh(windGeo, mat);
    wind.position.set(0, 0.68, 0.38);
    wind.rotation.x = -0.58;
    addBodyPart(wind, 'Panoramic Curved Windshield');

    // Curved Double-Bubble Roof Panel
    const roofGeo = new THREE.BoxGeometry(1.18, 0.045, 0.95);
    const roof = new THREE.Mesh(roofGeo, mat);
    roof.position.set(0, 0.98, -0.32);
    addBodyPart(roof, 'Lightweight Composite Roof');

    // Tapered Fastback Rear Hatch Glass
    const rearGlassGeo = new THREE.BoxGeometry(1.14, 0.045, 0.98);
    const rearGlass = new THREE.Mesh(rearGlassGeo, mat);
    rearGlass.position.set(0, 0.78, -1.05);
    rearGlass.rotation.x = 0.52;
    addBodyPart(rearGlass, 'Fastback Rear Glass Windshield');

    // C. SCULPTED FLANKS, DOORS & SIDE AIR INTAKES
    for (let side of [-0.74, 0.74]) {
      // Sculpted Door Shell
      const doorGeo = new THREE.BoxGeometry(0.065, 0.48, 1.62);
      const door = new THREE.Mesh(doorGeo, mat);
      door.position.set(side, 0.44, -0.2);
      addBodyPart(door, 'Sculpted Aerodynamic Door Panel');

      // Front Flared Fender Arch
      const frontArchGeo = new THREE.TorusGeometry(0.42, 0.08, 12, 24, Math.PI);
      frontArchGeo.rotateY(Math.PI / 2);
      const frontArch = new THREE.Mesh(frontArchGeo, mat);
      frontArch.position.set(side * 1.04, 0.28, 1.25);
      addBodyPart(frontArch, 'Front Flared Wheel Arch');

      // Rear Muscular Hip / Fender Flare
      const rearArchGeo = new THREE.TorusGeometry(0.44, 0.10, 12, 24, Math.PI);
      rearArchGeo.rotateY(Math.PI / 2);
      const rearArch = new THREE.Mesh(rearArchGeo, mat);
      rearArch.position.set(side * 1.05, 0.28, -1.35);
      addBodyPart(rearArch, 'Rear Muscular Quarter Panel Flare');

      // Recessed Side Air Intake Duct (Cooling to engine & rear brakes)
      const ductGeo = new THREE.BoxGeometry(0.08, 0.26, 0.35);
      const duct = new THREE.Mesh(ductGeo, carbon);
      duct.position.set(side * 0.96, 0.36, -0.85);
      this.bodyGroup.add(duct);

      // Aerodynamic Side Mirrors
      const mirrorArm = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.14, 12), carbon);
      mirrorArm.position.set(side * 1.05, 0.68, 0.32);
      mirrorArm.rotation.z = side > 0 ? -Math.PI / 3 : Math.PI / 3;
      this.bodyGroup.add(mirrorArm);

      const mirrorHead = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.16), mat);
      mirrorHead.position.set(side * 1.15, 0.72, 0.32);
      addBodyPart(mirrorHead, 'Aerodynamic Side Mirror');

      // Carbon Fiber Ground-Effect Side Skirts
      const skirtGeo = new THREE.BoxGeometry(0.08, 0.04, 2.15);
      const skirt = new THREE.Mesh(skirtGeo, carbon);
      skirt.position.set(side * 1.04, 0.11, -0.05);
      this.bodyGroup.add(skirt);
    }

    // D. REAR FASCIA, DIFFUSER & GT REAR WING
    // Rear Decklid & Bumper
    const rearBumperGeo = new THREE.BoxGeometry(1.58, 0.32, 0.48);
    const rearBumper = new THREE.Mesh(rearBumperGeo, mat);
    rearBumper.position.set(0, 0.35, -1.75);
    addBodyPart(rearBumper, 'Rear Bumper Fascia');

    // Continuous OLED Horizon Taillight Strip (Full-width glowing red)
    const tailGeo = new THREE.BoxGeometry(1.52, 0.04, 0.05);
    const taillight = new THREE.Mesh(tailGeo, this.matTaillightLED);
    taillight.position.set(0, 0.54, -1.98);
    this.bodyGroup.add(taillight);

    // Carbon Fiber Rear Downforce Diffuser with Vertical Aero Fins
    const diffFloorGeo = new THREE.BoxGeometry(1.48, 0.04, 0.65);
    const diffFloor = new THREE.Mesh(diffFloorGeo, carbon);
    diffFloor.position.set(0, 0.12, -1.75);
    diffFloor.rotation.x = -0.15;
    this.bodyGroup.add(diffFloor);

    // 4 Vertical Diffuser Air Strakes
    for (let finX of [-0.45, -0.15, 0.15, 0.45]) {
      const finGeo = new THREE.BoxGeometry(0.02, 0.14, 0.55);
      const fin = new THREE.Mesh(finGeo, carbon);
      fin.position.set(finX, 0.14, -1.75);
      fin.rotation.x = -0.15;
      this.bodyGroup.add(fin);
    }

    // Carbon Fiber GT Rear Wing on Swan-Neck Uprights
    const wingGeo = new THREE.BoxGeometry(1.58, 0.035, 0.32);
    const wing = new THREE.Mesh(wingGeo, carbon);
    wing.position.set(0, 0.88, -1.82);
    wing.rotation.x = -0.08;
    this.bodyGroup.add(wing);

    // Wing Endplates
    for (let side of [-0.79, 0.79]) {
      const epGeo = new THREE.BoxGeometry(0.02, 0.16, 0.36);
      const ep = new THREE.Mesh(epGeo, carbon);
      ep.position.set(side, 0.88, -1.82);
      this.bodyGroup.add(ep);
    }

    // Dual Swan-Neck Mount Uprights
    for (let side of [-0.35, 0.35]) {
      const mountGeo = new THREE.BoxGeometry(0.02, 0.32, 0.12);
      const mount = new THREE.Mesh(mountGeo, this.matRim);
      mount.position.set(side, 0.72, -1.78);
      mount.rotation.x = 0.2;
      this.bodyGroup.add(mount);
    }

    // Quad Polished Titanium Exhaust Tips (Integrated into diffuser)
    const exhaustX = [-0.42, -0.32, 0.32, 0.42];
    for (let exX of exhaustX) {
      const tipGeo = new THREE.CylinderGeometry(0.042, 0.042, 0.22, 20);
      tipGeo.rotateX(Math.PI / 2);
      const tipMesh = new THREE.Mesh(tipGeo, this.matRim);
      tipMesh.position.set(exX, 0.16, -1.98);
      tipMesh.userData = { componentId: 'exhaust', name: 'Titanium Tuned Exhaust Outlet' };
      this.bodyGroup.add(tipMesh);
      this.exhaustTips.push(tipMesh);
    }
  }

  // 6. VIRTUAL CHASSIS DYNO ROLLERS
  buildDynoRollers() {
    // 2 Sets of Cylindrical Dyno Rollers embedded under Front & Rear Wheels
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      metalness: 0.95,
      roughness: 0.2
    });

    const dynoFrameMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.4
    });

    const positionsZ = [1.25, -1.35]; // Front & Rear axles

    for (let z of positionsZ) {
      // Chassis Dyno Pit Frame
      const pitGeo = new THREE.BoxGeometry(2.1, 0.06, 0.85);
      const pitMesh = new THREE.Mesh(pitGeo, dynoFrameMat);
      pitMesh.position.set(0, -0.04, z);
      this.dynoRollersGroup.add(pitMesh);

      // Left & Right Rollers (each tire rests between 2 twin rollers)
      for (let side of [-0.80, 0.80]) {
        for (let rOffset of [-0.14, 0.14]) {
          const rollerGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.32, 24);
          rollerGeo.rotateZ(Math.PI / 2);
          const roller = new THREE.Mesh(rollerGeo, rollerMat);
          roller.position.set(side, -0.01, z + rOffset);
          this.dynoRollersGroup.add(roller);
          this.dynoRollers.push(roller);
        }
      }
    }
  }

  setBodyMode(mode) {
    let mat = this.matBodyGlass;
    let visible = true;

    if (mode === 'glass') {
      mat = this.matBodyGlass;
    } else if (mode === 'hologram') {
      mat = this.matBodyHolo;
    } else if (mode === 'wireframe') {
      mat = this.matBodyWire;
    } else if (mode === 'solid') {
      mat = this.matBodySolid;
    } else if (mode === 'hidden') {
      visible = false;
    }

    this.bodyGroup.visible = visible;
    for (let m of this.bodyMeshes) {
      m.material = mat;
    }
  }

  update(physics, dt, explodedFactor) {
    // 1. Rotate Wheels based on wheel rotation angle from physics
    const rotAngle = physics.wheelAngle;
    for (let w of this.wheels) {
      w.rotating.rotation.x = rotAngle;
      // Front wheel active steering with Ackermann geometry
      if (w.isFront) {
        w.hub.rotation.y = physics.steeringAngle;
      }
    }

    // 2. Cockpit Steering Wheel turns with front wheels
    if (this.steeringWheel) {
      this.steeringWheel.rotation.z = -physics.steeringAngle * 2.8;
    }

    // 3. Rotate Dyno Rollers synchronously with wheel rotation speed
    for (let roller of this.dynoRollers) {
      roller.rotation.x += physics.wheelRotSpeed * dt * 1.5;
    }

    // 4. Rotate Driveshaft & Transmission Gears
    if (this.driveShaft) {
      this.driveShaft.rotation.z += (physics.wheelRotSpeed * physics.finalDrive) * dt;
    }
    for (let g of this.gearboxGears) {
      g.rotation.z += (physics.rpm / 60.0) * Math.PI * 2.0 * dt;
    }

    // 5. Dynamic Thermal Glow on Brake Discs
    const brakeRatio = Math.max(0, Math.min(1.0, (physics.brakeTemp - 45) / 550.0));
    for (let bd of this.brakeDiscs) {
      if (brakeRatio > 0.05) {
        bd.material.emissive.setRGB(brakeRatio * 1.0, brakeRatio * 0.25, 0.0);
      } else {
        bd.material.emissive.setRGB(0, 0, 0);
      }
    }

    // 6. Exploded View Displacements
    this.bodyGroup.position.set(0, explodedFactor * 0.52, 0);
    for (let w of this.wheels) {
      const sign = w.isLeft ? -1 : 1;
      w.hub.position.x = (sign * 0.80) + (sign * explodedFactor * 0.38);
    }
    this.drivetrainGroup.position.set(0, -explodedFactor * 0.18, 0);
  }

  setVisibility(subsystem, visible) {
    if (subsystem === 'chassis') {
      this.chassisGroup.visible = visible;
    } else if (subsystem === 'drivetrain') {
      this.drivetrainGroup.visible = visible;
    } else if (subsystem === 'wheels') {
      this.wheelsGroup.visible = visible;
    }
  }
}
