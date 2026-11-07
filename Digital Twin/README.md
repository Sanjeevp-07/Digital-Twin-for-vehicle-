# Connected Vehicle Cloud-Based Digital Twin Platform

A pure monitoring, telemetry, and diagnostics observatory dashboard for the Virtual Car Simulator.

## Architecture
- **Port 8080 (`server/cloud-backend.js`)**: Express REST API + WebSocket broker for real-time CAN-bus telematics.
  - State shadow tracking (RPM, Speed, Fuel, Boost, Temperatures, Pressures).
  - OBD-II Diagnostic Trouble Code (DTC) engine (`P0217`, `P0524`, `P0087`, etc.).
  - Real-time component health matrix calculation (0–100%).
  - Remaining Useful Life (RUL) predictive maintenance models.
- **Port 3001 (`src/main.js`, `src/twin-3d.js`)**: Vite-powered Network Operations Center (NOC) dashboard.
  - 3D Twin mirroring the virtual vehicle in real time: crank angle, pistons, steering, wheel rotation, fuel level slosh, dynamic thermal glow on brakes & exhaust, and dynamic engine block swap.
  - Multi-channel live telemetry oscilloscope charts.
  - Health matrix radar / gauge displays.
  - Diagnostic trouble code logger with live DTC clear actions.

## Quick Start

### 1. From the Terminal
```cmd
cd "C:\Users\Sanjeev\OneDrive\Desktop\Car Simulator\Digital Twin"
npm install
npm run dev
```

### 2. Using the Batch File
Double-click `Run_Digital_Twin.bat` inside this folder. It automatically launches both the backend server and the frontend dashboard and opens `http://localhost:3001` in your browser.

## Connection
The Digital Twin connects to the Virtual Car Simulator via:
1. **WebSocket**: `ws://localhost:8080?role=dashboard`
2. **BroadcastChannel**: `connected_car_telematics_stream` (instant zero-config browser synchronization)

