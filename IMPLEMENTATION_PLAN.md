# Implementation Plan & Engineering Record: 3D Transparent Car & Engine Simulator

> **Project Name:** Real Engine & Car Simulator 3D  
> **Status:** Phase 1 Complete (Operational v1.0) / Phase 2 in Planning  
> **Repository:** `Car Simulator`  
> **Target Platform:** Modern WebGL (Chrome, Edge, Firefox, Brave) & Standalone Local Launcher  

---

## 1. System Architecture & Component Mapping

```
Car Simulator/
├── index.html                  # Cyberpunk HUD layout, gauges, canvas plots & modals
├── vite.config.js              # Vite server configuration & build bundling
├── package.json                # Project dependencies (Three.js, Vite)
├── Run_Simulator.bat           # 1-Click Windows launch script
├── IMPLEMENTATION_PLAN.md      # Living implementation plan & engineering change record
├── README.md                   # User documentation & controls reference
├── dist/                       # Minified production build distribution
└── src/
    ├── style.css               # Futuristic dark UI theme, glow effects & animations
    ├── main.js                 # Scene setup, camera presets, lighting & render loop
    ├── physics.js              # Powertrain math, Otto cycle thermodynamics & fluid rates
    ├── engine.js               # 3D kinematic engine (crank, rods, pistons, valves, spark)
    ├── fluids.js               # Fuel tank, high-pressure pump, coolant & oil circuits
    ├── car.js                  # Transparent GT body, spaceframe chassis, wheels & brakes
    ├── audio.js                # Web Audio API multi-oscillator procedural synthesizer
    └── ui.js                   # HUD controller, 2D Canvas dyno/PV charts & keyboard events
```

---

## 2. Completed Milestones (Record of Work Done)

### ✅ Milestone 1: Environment & Project Scaffolding
- Initialized Node/NPM workspace with modern ES modules configuration.
- Integrated `three` (v0.187.0) and `vite` (v8.3.6).
- Configured `vite.config.js` for zero-lag local serving with host access on port 3000.
- Created `Run_Simulator.bat` for one-click Windows execution without requiring terminal interaction.

### ✅ Milestone 2: Cyberpunk Telemetry HUD & Styling (`index.html`, `style.css`)
- Recreated the dark scientific aesthetic of combustion sandbox simulators.
- Designed two primary floating HUD sidebars:
  - **Left Sidebar**: Engine selector, Start/Stop ignition, Throttle slider, Drivetrain controls, Fluid switches, Transparency selector, and Exploded View slider.
  - **Right Sidebar**: Digital Tachometer/Speedometer hero display, 8-channel live sensor stats, Dyno Curves Canvas, Thermodynamic P-V Indicator Canvas, Fluid Schematic Canvas, Launch Timer, and Event Log.
- Added bottom interactive pedals overlay (Gas, Brake, Clutch) with real-time level animations.

### ✅ Milestone 3: Powertrain & Thermodynamic Physics Simulation (`physics.js`)
- Implemented 5 engine architectures with realistic specifications:
  - **Inline-6 (3.0L DOHC 24V)**: Smooth straight-6 with 1-5-3-6-2-4 firing order.
  - **Inline-4 (2.0L Turbo 16V)**: High-revving lightweight engine.
  - **V8 (5.0L Crossplane 32V)**: Muscle car firing sequence with 90° bank angle.
  - **V12 (6.5L Supercar 48V)**: Exotic high-RPM configuration with 60° bank angle.
  - **Boxer-4 (2.5L Flat)**: 180° horizontally opposed flat-four layout.
- Engineered kinematics formulas for slider-crank piston displacement and connecting rod angularity.
- Implemented 4-stroke thermodynamic cycle tracking (Intake, Compression, Power, Exhaust) with dynamic cylinder pressure and clearance volume calculations.
- Implemented transmission physics: 6 forward gear ratios, reverse, neutral, clutch slip/engagement, aerodynamic drag, rolling resistance, and braking deceleration.
- Integrated thermal physics: Engine block temperature, coolant temperature, oil pressure, exhaust thermal build-up, and brake rotor heating.
- Integrated automated performance launch timer (0-60 mph, 0-100 km/h, 1/4 mile).

### ✅ Milestone 4: 3D Procedural Engine Kinematics & Combustion (`engine.js`)
- Modeled transparent cutaway engine block with cylinder liners.
- Built counterweighted crankshaft assembly with flywheel and harmonic balancer.
- Built articulated connecting rods with wrist pins and reciprocating pistons.
- Built dual overhead camshafts with eccentric lobes depressing intake and exhaust valves.
- Implemented electric spark ignition flashes and expanding combustion fireballs timed to each cylinder's power stroke.
- Created dynamic thermal emission shaders on exhaust headers transitioning from dark bronze to cherry red and incandescent orange under sustained load.

### ✅ Milestone 5: 3D Fluid Systems, Pumps & Particle Streams (`fluids.js`)
- **Fuel System**:
  - Transparent rear fuel tank with dynamic liquid level and animated sloshing surface waves.
  - High-pressure electric fuel pump with spinning internal turbine impeller and glowing green/red status LED.
  - Transparent fuel line with 70 streaming fluid particles that accelerate with fuel consumption ($L/h$).
  - Common fuel rail with solenoid injectors that pulse conical fuel spray mists into the intake ports.
- **Cooling System**:
  - Front aluminum radiator core with dual electric fans that activate automatically when coolant exceeds $80^\circ\text{C}$.
  - Centrifugal water pump with spinning impeller.
  - Blue cold return and crimson hot supply coolant hoses with internal circulation.
- **Lubrication System**:
  - Transparent oil pan/sump with golden lubricating oil, engine-driven pump, and oil filter.
- **Brake Hydraulics**:
  - Master cylinder on firewall with brake lines branching to all 4 calipers.

### ✅ Milestone 6: 3D Transparent Car Body, Chassis & Drivetrain (`car.js`)
- Sculpted aerodynamic sports GT coupe body mesh (hood, splitter, roof, doors, windshield, spoiler, diffuser).
- Implemented multi-mode body materials:
  - **Glass Tinted**: Clear physical glass with refraction (`transmission: 0.90`, `ior: 1.48`).
  - **Hologram X-Ray**: Neon cyan glowing hologram with additive edge lighting.
  - **Ghost Wireframe**: Engineering wireframe mesh.
  - **Metallic Carbon**: Gloss finish solid body.
  - **Hidden**: Fully invisible body for pure mechanical inspection.
- Tubular spaceframe chassis, roll cage, and front/rear double-wishbone suspension.
- 4 alloy wheels with rotating rubber tires and ventilated brake rotors that dynamically glow red-hot under hard braking.
- Transparent 6-speed gearbox casing with meshing internal gears, spinning propeller driveshaft, and rear differential.

### ✅ Milestone 7: Procedural Audio Synthesizer (`audio.js`)
- Web Audio API real-time synthesis:
  - Starter motor whining oscillator and cyclic cranking chug.
  - Multi-harmonic cylinder combustion pulses linked to engine RPM and cylinder count.
  - Dynamic low-pass filter opening with throttle to simulate mechanical intake roar.
  - High-RPM rev-limiter fuel cut stutter.
  - Turbocharger spool whistle and blow-off valve pneumatic hiss on throttle lift-off.

### ✅ Milestone 8: Telemetry Visualizations & Canvas Plots (`ui.js`)
- **Live Dyno Graph**: Plotted HP and Torque curves with real-time tracer dot.
- **Cylinder 1 P-V Indicator**: Plotted Otto cycle loop with real-time volume and pressure tracer ball.
- **2D Fluid Schematic**: Animated flow diagram showing Tank ➔ Pump ➔ Rail ➔ Injectors with pulsating particles.
- Real-time diagnostic terminal event log with automatic timestamping.
- Keyboard bindings: `W`/`S` (Gas/Brake), `E`/`Q` (Shift Up/Down), `C` (Clutch), `Enter` (Start/Stop), `X` (Exploded view).

### ✅ Milestone 9: Scene Orchestrator & Camera Rig (`main.js`)
- OrbitControls with smooth damping and floor limits.
- Smooth camera preset interpolator: Full Car, Engine Bay Macro, Fuel Tank Zoom, Cockpit POV, and Chassis Underbody.
- Studio lighting rig (key light, rim cyan, rim amber, engine bay spotlight) and cyber floor grid.
- Dual exhaust tips emitting exhaust smoke puffs and backfire flame bursts.

---

### ✅ Milestone 10: Realistic Sculpted GT Body & Virtual Dyno Rollers (`car.js`)
- Sculpted aerodynamic curved hood with dual recessed air extraction ducts and power bulge.
- Carbon-fiber front splitter with aerodynamic canards and central black honeycomb radiator intake.
- LED projector headlights with luminous cyan DRL eyebrows and real-time spot beams.
- Panoramic curved windshield and double-bubble aerodynamic roof canopy.
- Sculpted door panels with deep side air cooling ducts and aerodynamic side-view mirrors.
- Flared widebody front and rear muscular quarter panel wheel arches.
- Full-width horizon OLED taillight lightbar with incandescent crimson glow.
- Carbon fiber rear downforce diffuser with 4 vertical airflow strakes and quad titanium exhaust outlets.
- Carbon fiber GT rear wing mounted on dual swan-neck aluminum uprights with aerodynamic endplates.
- **Virtual Chassis Dyno Rollers**: Dual twin rollers embedded under front and rear tires, spinning synchronously with wheel rotation speed.
- **Active Front-Wheel Steering**: Key-bound (`A`/`D`) steering with auto-centering spring physics and synchronized interior steering wheel rotation.
- **Turbo Boost Simulation**: Dynamic intake manifold pressure from -0.75 bar (vacuum at idle) up to +1.85 bar under full throttle/boost.

---

## 3. Upcoming Milestones & Next Enhancements

| Milestone | Feature Description | Priority | Status |
| :--- | :--- | :--- | :--- |
| **M11** | **Interactive 3D Raycasting & Tooltips**: Click/hover any 3D component (Fuel Pump, Injector, Piston, Turbo, Caliper) to display a floating inspection card with real-time pressure, temp, and mechanical specs. | High | ⏳ Next |
| **M14** | **Cross-Sectional Engine Cutaway Plane**: Dynamic clipping plane allowing the user to slice horizontally or vertically through the engine block. | Medium | ⏳ Planned |
| **M15** | **Standalone Desktop Package**: Portable Electron wrapper or standalone executable for distribution. | Low | ⏳ Planned |

---

## 4. Engineering Change Record (Living Changelog)

| Version | Date | Changes & Implementations | Author |
| :--- | :--- | :--- | :--- |
| **v1.0.0** | 2026-11-06 | Initial release: Transparent GT car body, 5-engine combustion kinematics, transparent fuel tank, spinning high-pressure fuel pump, coolant/oil systems, dyno & P-V canvas plots, Web Audio API sound engine, and Windows 1-click batch launcher. | Assistant & User |
| **v1.1.0** | 2026-11-06 | Realistic finished GT supercar body sculpting (curved hood, front splitter with canards, projector headlights, side intakes, flared hips, horizon OLED lightbar, rear diffuser, quad titanium exhausts), active front-wheel steering kinematics with cockpit steering wheel synchronization, virtual chassis dyno rollers, and turbo boost gauge telemetry. | Assistant & User |

