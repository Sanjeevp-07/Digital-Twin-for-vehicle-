# 🚀 Beginner-Friendly Step-by-Step Guide: How to Run This Project

Welcome! Whether you just cloned this project from GitHub or downloaded it as a ZIP file, you can run everything **immediately with a single click or command**—**without needing to manually install any libraries or requirements!**

---

## ⚡ Super-Fast Quick Start (Choose Any Method)

### Method 1: The "One-Click" Automatic Launcher (Recommended for Windows)
> *Works whether you have Node.js or not!*

1. Open the project folder (`Car Simulator`).
2. Double-click **`START.bat`**.
3. **That's it!**
   - The launcher will automatically detect your setup.
   - If libraries are missing, it installs them automatically in the background without asking you to type anything.
   - If Node.js is not installed, it automatically switches to the built-in Windows engine and launches immediately.
   - It will open both the **Virtual Car** and the **Digital Twin** side-by-side in your default web browser!

---

### Method 2: Zero-Install Standalone Mode (No Node.js / No npm needed!)
> *Perfect if you do not have Node.js installed on your computer.*

1. In the project folder, double-click **`Run_Without_Node.bat`**.
2. This runs directly using Windows' native built-in engine.
3. Your browser will open immediately:
   - **Virtual Car Simulator:** `http://localhost:3000`
   - **Digital Twin Dashboard:** `http://localhost:3001`

---

### Method 3: Instant Run using Node.js (Zero-Dependency)
> *If you have Node.js installed and want it to open instantly in 1 second without running `npm install`:*

1. Open your terminal in this folder.
2. Run this single command:
   ```bash
   npm start
   ```
   *(or `node standalone_server.js`)*
3. Open your browser:
   - Car Simulator: `http://localhost:3000`
   - Digital Twin: `http://localhost:3001`

---

### Method 4: For Linux and macOS Users
1. Open your Terminal in this folder.
2. Make the script executable (only needed once):
   ```bash
   chmod +x start.sh
   ```
3. Run:
   ```bash
   ./start.sh
   ```
   *This automatically sets up all dependencies and opens both apps in your default browser.*

---

## 🎮 How the Two Platforms Work Together

When both windows are open side-by-side:

| Left Screen: Virtual Car Simulator (`Port 3000`) | Right Screen: Cloud Digital Twin (`Port 3001`) |
| :--- | :--- |
| **Full interactive driving controls** | **Pure monitoring & diagnostic observatory** |
| • Start the engine with the **START** button | • Synchronized 3D twin mirrors pistons, crank, and wheels |
| • Press **W / S** or use pedals to accelerate and brake | • Real-time telemetry graphs (RPM, Boost, Oil, Coolant) |
| • Switch gears (**1-6**, **N**, **R**) or engine configs (V8, V12, I6) | • Live component health matrix (Engine, Brakes, Cooling, etc.) |
| • Turn on Dyno rollers and watch fluids slosh in the tank | • Live OBD-II Diagnostic Trouble Code (DTC) scanner |

> 💡 **Real-Time Magic:** Everything you do in the Virtual Car is streamed instantly to the Digital Twin via the browser's built-in `BroadcastChannel` and WebSocket gateway!

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Do I need to run `npm install` before running?**  
**A:** No! The `START.bat` (on Windows) or `start.sh` (on Mac/Linux) script checks and installs everything for you automatically. If you don't even have Node.js, `Run_Without_Node.bat` runs directly using Windows native features.

**Q: Which web browser should I use?**  
**A:** Google Chrome, Microsoft Edge, Brave, or Mozilla Firefox all work with full WebGL 3D graphics hardware acceleration enabled.

**Q: How do I stop the servers when I am done?**  
**A:** Simply close the terminal/command prompt windows.

