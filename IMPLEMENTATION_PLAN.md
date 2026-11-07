# Implementation Plan & Engineering Record: Connected Vehicle Simulator & Cloud Digital Twin

> **Project Name:** Connected Vehicle Simulator & Cloud-Based Digital Twin Platform  
> **Status:** Phase 2 Complete (v2.3.0 Universal Clone & Zero-Dependency Execution System)  
> **Ecosystem Structure:** Two distinct, connected platforms on the same root location:
> 1. **Virtual Car Simulator (`C:\Users\Sanjeev\OneDrive\Desktop\Car Simulator`)** - Driving controls, 3D physics, engine configurations, fluid cycles, telematics gateway.
> 2. **Cloud Digital Twin (`C:\Users\Sanjeev\OneDrive\Desktop\Car Simulator\Digital Twin`)** - Pure monitoring NOC observatory, 3D twin mirror, CAN-bus broker, predictive analytics, OBD-II DTC engine.

---

## 1. Directory & Service Topology

```
Car Simulator/
├── index.html                           # Virtual Car Simulator HUD & driving controls (Port 3000)
├── vite.config.js                       # Vite dev configuration with relative base (Port 3000)
├── package.json                         # Root package manifest with zero-dependency scripts
├── START.bat                            # 🚀 Universal Auto-Launcher (Auto-installs & launches)
├── Run_Without_Node.bat                 # 🪟 Windows Native Zero-Install Runner (No Node.js needed)
├── start.sh                             # 🐧/🍎 Cross-Platform Launcher for Linux and macOS
├── standalone_server.js                 # ⚡ Zero-Dependency Node.js server (Built-in http/fs only)
├── server_powershell.ps1                # Native Windows .NET HttpListener static server
├── HOW_TO_RUN.md                        # Beginner-friendly step-by-step execution guide
├── IMPLEMENTATION_PLAN.md               # Living engineering record & milestone history
├── README.md                            # Driving controls reference & GitHub clone quick start
├── dist/                                # Pre-bundled production build (portable relative paths)
├── src/
│   ├── main.js                          # Scene setup, render loop, camera controllers
│   ├── car.js                           # Transparent GT body, chassis, wheels & brakes
│   ├── engine.js                        # 3D kinematic engine (crank, pistons, valves, spark)
│   ├── fluids.js                        # Fuel, coolant & oil fluid circuits
│   ├── physics.js                       # Powertrain thermodynamics & gear ratios
│   ├── audio.js                         # Web Audio procedural engine sound synthesizer
│   ├── ui.js                            # Driving controls HUD & 2D canvas plots
│   └── telematics.js                    # High-frequency telematics gateway (30-60 Hz)
│
└── Digital Twin/                        # Relocated Digital Twin Platform
    ├── index.html                       # Monitoring-only NOC observatory dashboard (Port 3001)
    ├── vite.config.js                   # Vite dev configuration with relative base (Port 3001)
    ├── package.json                     # Backend & frontend dependencies (three, ws, express, cors, vite)
    ├── Run_Digital_Twin.bat             # 1-Click Digital Twin launcher (Backend + Dashboard)
    ├── README.md                        # Digital Twin architecture documentation
    ├── dist/                            # Pre-bundled production build (portable relative paths)
    ├── server/
    │   └── cloud-backend.js             # REST API & WebSocket broker (Port 8080)
    │                                    # - State shadow tracking
    │                                    # - OBD-II DTC diagnostic engine
    │                                    # - Health matrix computation (0-100%)
    │                                    # - Remaining useful life (RUL) estimation
    └── src/
        ├── main.js                      # Ingestion pipeline & sensor data binding
        ├── twin-3d.js                   # 3D synchronized twin with dynamic block swaps & heat glow
        ├── charts.js                    # Rolling 4-channel time-series oscilloscope
        ├── diagnostics.js               # Component health radar & DTC fault logger
        └── style.css                    # NOC dark cyber telemetry theme
```

---

## 2. Completed Milestones (Record of Work Done)

### ✅ Milestone 1: Virtual Car Simulation & Kinematics (`Car Simulator/`)
- **3D Kinematic Engine**: 5 engine architectures (Inline-6, Inline-4, V8, V12, Boxer-4) with realistic slider-crank displacement formulas, rotating crankshaft, oscillating connecting rods, moving pistons, camshafts, and synchronized spark ignition.
- **Fluid Systems**: Fuel tank with dynamic sloshing fluid level, animated fuel pump, high-pressure fuel rail, coolant loop, and oil lubrication circuit.
- **Drivetrain & Physics**: 6-speed manual and automatic transmission, clutch slip dynamics, throttle curve, aerodynamic drag, rolling resistance, and dyno rollers.
- **Procedural Audio**: Web Audio API engine sound synthesis with frequency modulation tracking engine RPM and load.
- **Exploded View**: Interactive slider smoothly separating engine components along their normal axes for inspection.

### ✅ Milestone 2: Telematics Gateway (`src/telematics.js`)
- Engineered real-time transmission of 26 telemetry channels at 30–60 Hz:
  - Dynamic: `rpm`, `speedKmh`, `gear`, `throttle`, `brake`, `clutch`, `steeringAngle`, `crankAngle`, `wheelAngle`, `explodedFactor`, `dynoRollersActive`.
  - Powertrain: `horsepower`, `torque`, `boostPressure`, `engineConfig`, `engineConfigName`.
  - Fluids & Thermals: `fuelLevel`, `fuelFlowRate`, `fuelRailPressure`, `fuelPumpActive`, `coolantTemp`, `oilPressure`, `oilTemp`, `exhaustTemp`, `brakeTemp`.
  - Odometry: `distanceTraveled`.
- Dual communication pipeline: WebSocket (`ws://localhost:8080?role=vehicle`) with fallback to browser `BroadcastChannel('connected_car_telematics_stream')` for instant zero-latency cross-tab communication.

### ✅ Milestone 3: Cloud Telematics Backend (`Digital Twin/server/cloud-backend.js`)
- Express REST API & WebSocket server on Port 8080.
- State Shadow tracking all parameters with timestamps.
- Rule-based OBD-II Diagnostic Trouble Code (DTC) evaluation:
  - `P0217`: Engine Coolant Over-Temperature Condition (> 108°C)
  - `P0524`: Engine Oil Pressure Too Low (< 1.2 bar while running)
  - `P0087`: Fuel Rail/System Pressure Too Low (< 3.0 bar while active)
  - `P0234`: Engine Overboost Condition (> 1.85 bar)
  - `P0500`: Vehicle Speed Sensor Malfunction
  - `P0300`: Random/Multiple Cylinder Misfire Detected
- Component Health Matrix calculations (0–100%): Engine Block, Transmission, Brake System, Fuel Injection, Cooling Loop, Lubrication Circuit.
- Remaining Useful Life (RUL) predictive degradation models.

### ✅ Milestone 4: Dedicated Digital Twin Monitoring Dashboard (`Digital Twin/`)
- **Strict Separation of Concerns**: Zero driving controls on the Digital Twin dashboard. Pure monitoring, telemetry display, and diagnostics observatory.
- **3D Synchronized Avatar (`src/twin-3d.js`)**:
  - Live mirror of crankshaft rotation, piston displacement, steering angle, wheel spin, and sloshing fuel level.
  - Dynamic 3D engine block swapping when the virtual vehicle switches engine configs (I6, I4, V8, V12, Boxer-4).
  - Dynamic thermal glow on exhaust manifold and brake discs mapped to temperature.
  - Health X-Ray shader overlay highlighting degraded subsystems in warning yellow or critical red.
- **Multi-Channel Oscilloscope (`src/charts.js`)**: Rolling 4-channel Canvas time-series plotter displaying RPM, Coolant Temp, Boost Pressure, and Oil Pressure.
- **Component Health Matrix & Diagnostics (`src/diagnostics.js`)**: Live health percentage gauges, active DTC warnings, and one-click DTC clear actions.

### ✅ Milestone 5: Relocation & Standalone Packaging (`Car Simulator/Digital Twin`)
- Relocated Digital Twin into user-specified directory: `C:\Users\Sanjeev\OneDrive\Desktop\Car Simulator\Digital Twin`.
- Installed all dependencies (`three`, `ws`, `express`, `cors`, `vite`).
- Verified production bundling: `npm run build` completed with 0 errors.
- Created `Run_Digital_Twin.bat` and updated master desktop launcher `Launch_Full_Connected_System.bat`.

### ✅ Milestone 6: Universal Clone & Zero-Dependency Execution System (v2.3.0)
- **Zero-Manual-Setup Auto-Launcher (`START.bat`)**:
  - Checks if Node.js is installed; if not, automatically falls back to Windows native engine.
  - Detects if `node_modules` is missing; if so, runs `npm install` automatically in background without asking user to type commands.
  - Launches all 3 services and opens browser.
- **Windows Built-in Zero-Install Runner (`Run_Without_Node.bat` & `server_powershell.ps1`)**:
  - Uses Windows native .NET `System.Net.HttpListener` to serve pre-bundled production builds on ports 3000 and 3001.
  - Requires **zero Node.js, zero Python, zero npm, zero external libraries**.
  - Telematics syncs seamlessly in real-time across tabs via browser-native `BroadcastChannel`.
- **Node.js Zero-Dependency Runner (`standalone_server.js`)**:
  - Uses strictly Node standard library (`http`, `fs`, `path`).
  - Launches in under 1 second without running `npm install`.
- **Cross-Platform Launcher (`start.sh`)**:
  - Handles dependency auto-installation and browser launch on Linux and macOS.
  - Beginner-Friendly Step-by-Step Documentation (`HOW_TO_RUN.md` & `How to run.md`).

---

## 3. Quick Run Summary

| If your user has... | They simply run: | What happens: |
| :--- | :--- | :--- |
| **Windows + Any Setup** | Double-click `START.bat` | Auto-detects everything, installs missing packages if needed, launches both dashboards. |
| **Windows + NO Node.js** | Double-click `Run_Without_Node.bat` | Runs immediately using Windows built-in engine with 0 installations. |
| **Node.js Installed** | `npm start` | Boots instant zero-dependency standalone servers on ports 3000 and 3001. |
| **Linux or macOS** | `./start.sh` | Auto-installs missing dependencies and opens both apps in default browser. |
