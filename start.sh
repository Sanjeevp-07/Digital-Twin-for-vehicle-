#!/usr/bin/env bash
# Universal Cross-Platform Launcher for Linux and macOS
# Automatically handles dependencies and launches the Connected Vehicle Ecosystem

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "======================================================================"
echo "   CONNECTED VEHICLE SIMULATOR & CLOUD DIGITAL TWIN ECOSYSTEM"
echo "   Universal Launcher (Linux / macOS)"
echo "======================================================================"

# Check for Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[NOTICE] Node.js not found. Checking for Python 3..."
    if command -v python3 >/dev/null 2>&1; then
        echo "[OK] Python 3 detected. Running standalone static mode..."
        (cd "$SCRIPT_DIR/dist" && python3 -m http.server 3000) &
        PID1=$!
        (cd "$SCRIPT_DIR/Digital Twin/dist" && python3 -m http.server 3001) &
        PID2=$!

        if command -v xdg-open >/dev/null 2>&1; then
            xdg-open "http://localhost:3000" &
            xdg-open "http://localhost:3001" &
        elif command -v open >/dev/null 2>&1; then
            open "http://localhost:3000" &
            open "http://localhost:3001" &
        fi

        echo "Servers running. Press Ctrl+C to stop."
        trap "kill $PID1 $PID2" EXIT
        wait
        exit 0
    else
        echo "[ERROR] Neither Node.js nor Python 3 found. Please install Node.js."
        exit 1
    fi
fi

# Auto-install root dependencies if missing
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "[SETUP] First-time setup: Installing vehicle simulator dependencies..."
    npm install
fi

# Auto-install Digital Twin dependencies if missing
if [ ! -d "$SCRIPT_DIR/Digital Twin/node_modules" ]; then
    echo "[SETUP] First-time setup: Installing Digital Twin dependencies..."
    (cd "$SCRIPT_DIR/Digital Twin" && npm install)
fi

echo "[1/3] Starting Cloud Ingestion Backend on port 8080..."
(cd "$SCRIPT_DIR/Digital Twin" && node server/cloud-backend.js) &
PID_BACKEND=$!

sleep 1

echo "[2/3] Starting Virtual Car Simulator on port 3000..."
npx vite --port 3000 --host &
PID_CAR=$!

sleep 1

echo "[3/3] Starting Cloud Digital Twin Dashboard on port 3001..."
(cd "$SCRIPT_DIR/Digital Twin" && npx vite --port 3001 --host) &
PID_TWIN=$!

sleep 2

# Open browser
if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "http://localhost:3000" &
    xdg-open "http://localhost:3001" &
elif command -v open >/dev/null 2>&1; then
    open "http://localhost:3000" &
    open "http://localhost:3001" &
fi

echo "======================================================================"
echo "   All systems operational! Press Ctrl+C to exit."
echo "======================================================================"

trap "kill $PID_BACKEND $PID_CAR $PID_TWIN 2>/dev/null" EXIT
wait

