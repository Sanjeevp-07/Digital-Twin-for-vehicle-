import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PhysicsSimulator } from './physics.js';
import { EngineAudioSystem } from './audio.js';
import { EngineModel } from './engine.js';
import { FluidSystems } from './fluids.js';
import { CarModel } from './car.js';
import { UIController } from './ui.js';

class App {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.clock = new THREE.Clock();

    // Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06080e);
    this.scene.fog = new THREE.FogExp2(0x06080e, 0.06);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(3.8, 2.2, 4.5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02; // Don't go below floor
    this.controls.minDistance = 0.5;
    this.controls.maxDistance = 15;
    this.controls.target.set(0, 0.35, 0);

    // Camera Rig for Smooth Preset Transitions
    this.cameraRig = {
      targetPos: this.camera.position.clone(),
      targetLookAt: new THREE.Vector3(0, 0.35, 0),
      isTransitioning: false,
      setPreset: (name) => this.setCameraPreset(name)
    };

    // Build Environment & Lighting
    this.initLighting();
    this.initFloorGrid();

    // Instantiate Subsystems
    this.physics = new PhysicsSimulator();
    this.audio = new EngineAudioSystem();
    this.car = new CarModel(this.scene);
    this.engine = new EngineModel(this.scene);
    this.fluids = new FluidSystems(this.scene);

    // Exhaust Smoke & Backfire Particles
    this.initExhaustParticles();

    // UI Coordinator
    this.ui = new UIController(
      this.physics,
      this.car,
      this.engine,
      this.fluids,
      this.audio,
      this.cameraRig
    );

    // Window Resize
    window.addEventListener('resize', () => this.onResize());

    // Start Animation Loop
    this.animate();
  }

  initLighting() {
    // Ambient / Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    this.scene.add(hemiLight);

    // Main Key Light (Cool white/cyan directional light)
    this.keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    this.keyLight.position.set(5, 8, 5);
    this.scene.add(this.keyLight);

    // Rim Fill Light 1 (Amber backlight from rear)
    const rimAmber = new THREE.DirectionalLight(0xf59e0b, 1.2);
    rimAmber.position.set(-5, 4, -6);
    this.scene.add(rimAmber);

    // Rim Fill Light 2 (Cyan backlight from front)
    const rimCyan = new THREE.DirectionalLight(0x00e5ff, 1.0);
    rimCyan.position.set(4, 3, -4);
    this.scene.add(rimCyan);

    // Engine Bay Spot Point Light
    this.engineSpot = new THREE.PointLight(0x38bdf8, 1.2, 3.5);
    this.engineSpot.position.set(0, 0.8, 0.85);
    this.scene.add(this.engineSpot);
  }

  initFloorGrid() {
    // Cyber-Engineering Floor Grid
    const gridHelper = new THREE.GridHelper(30, 60, 0x00e5ff, 0x1e293b);
    gridHelper.position.y = -0.05;
    this.scene.add(gridHelper);

    // Circular Glow Disc under the car
    const discGeo = new THREE.CircleGeometry(4.2, 64);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.12
    });
    const floorDisc = new THREE.Mesh(discGeo, discMat);
    floorDisc.position.y = -0.045;
    this.scene.add(floorDisc);
  }

  initExhaustParticles() {
    this.exhaustPuffs = [];
    const puffCount = 30;
    const puffGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const puffMat = new THREE.MeshBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.0
    });

    for (let i = 0; i < puffCount; i++) {
      const puff = new THREE.Mesh(puffGeo, puffMat.clone());
      puff.visible = false;
      this.scene.add(puff);
      this.exhaustPuffs.push({
        mesh: puff,
        life: 0,
        maxLife: 1.0,
        velocity: new THREE.Vector3()
      });
    }
  }

  spawnExhaustPuff(isBackfire = false) {
    const puffObj = this.exhaustPuffs.find(p => p.life <= 0);
    if (!puffObj) return;

    // Pick left or right exhaust tip
    const side = Math.random() > 0.5 ? -0.35 : 0.35;
    puffObj.mesh.position.set(side, 0.16, -1.95);
    puffObj.life = 1.0;
    puffObj.mesh.visible = true;

    if (isBackfire) {
      puffObj.mesh.material.color.setHex(0xffaa00);
      puffObj.mesh.material.opacity = 0.9;
      puffObj.mesh.scale.set(1.5, 1.5, 1.5);
      puffObj.velocity.set((Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.3, -2.5);
    } else {
      puffObj.mesh.material.color.setHex(0x94a3b8);
      puffObj.mesh.material.opacity = 0.35;
      puffObj.mesh.scale.set(1.0, 1.0, 1.0);
      puffObj.velocity.set((Math.random() - 0.5) * 0.2, 0.2 + Math.random() * 0.3, -1.2);
    }
  }

  setCameraPreset(name) {
    this.cameraRig.isTransitioning = true;
    if (name === 'iso') {
      this.cameraRig.targetPos.set(3.6, 2.2, 4.2);
      this.cameraRig.targetLookAt.set(0, 0.35, 0);
    } else if (name === 'engine') {
      // Zoom into engine bay
      this.cameraRig.targetPos.set(1.1, 0.95, 1.75);
      this.cameraRig.targetLookAt.set(0, 0.32, 0.85);
    } else if (name === 'fluids') {
      // Focus on rear fuel tank & pump
      this.cameraRig.targetPos.set(1.4, 0.85, -1.1);
      this.cameraRig.targetLookAt.set(0.05, 0.28, -1.35);
    } else if (name === 'cockpit') {
      this.cameraRig.targetPos.set(-0.32, 0.72, 0.05);
      this.cameraRig.targetLookAt.set(-0.32, 0.55, 1.8);
    } else if (name === 'chassis') {
      this.cameraRig.targetPos.set(2.8, 0.45, -0.6);
      this.cameraRig.targetLookAt.set(0, 0.20, -0.2);
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = this.clock.getDelta();

    // 1. Update Physics Engine
    this.physics.update(dt);

    // 2. Update Web Audio Synthesizer
    this.audio.update(this.physics);

    // 3. Update 3D Engine Kinematics & Visuals
    const exploded = this.ui.explodedFactor;
    this.engine.update(this.physics, exploded);

    // 4. Update 3D Fluid Systems & Pumps
    this.fluids.update(this.physics, dt, exploded);

    // 5. Update 3D Car & Running Gear
    this.car.update(this.physics, dt, exploded);

    // 6. Update UI & Telemetry Plots
    this.ui.update(dt);

    // 7. Exhaust Particles Update
    if (this.physics.running && Math.random() < (0.2 + (this.physics.rpm / this.physics.cfg.redlineRpm) * 0.6)) {
      const isBackfire = (this.physics.rpm > this.physics.cfg.redlineRpm - 150);
      this.spawnExhaustPuff(isBackfire);
    }

    for (let p of this.exhaustPuffs) {
      if (p.life > 0) {
        p.life -= dt * 1.8;
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.mesh.scale.multiplyScalar(1.0 + dt * 1.5);
        p.mesh.material.opacity = Math.max(0, p.life * 0.35);
        if (p.life <= 0) p.mesh.visible = false;
      }
    }

    // 8. Smooth Camera Preset Interpolation
    if (this.cameraRig.isTransitioning) {
      this.camera.position.lerp(this.cameraRig.targetPos, 0.08);
      this.controls.target.lerp(this.cameraRig.targetLookAt, 0.08);
      if (this.camera.position.distanceTo(this.cameraRig.targetPos) < 0.05) {
        this.cameraRig.isTransitioning = false;
      }
    }

    // 9. Update OrbitControls & Render
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on window load
window.addEventListener('DOMContentLoaded', () => {
  new App();
});

