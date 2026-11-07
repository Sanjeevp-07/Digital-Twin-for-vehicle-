@echo off
title Connected Vehicle Digital Twin - Telematics Platform
color 0b
echo =====================================================================
echo    CONNECTED VEHICLE CLOUD DIGITAL TWIN PLATFORM
echo    Monitoring, Telemetry, Predictive Analytics, Diagnostics
echo =====================================================================
cd /d "%~dp0"

echo [1/2] Starting Cloud Telematics Broker ^& REST API on Port 8080...
start "Digital Twin Cloud Backend (Port 8080)" cmd /k "cd /d ""%~dp0"" && node server/cloud-backend.js"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Digital Twin NOC Dashboard on Port 3001...
start "Digital Twin Vite Server (Port 3001)" cmd /k "cd /d ""%~dp0"" && npx vite --port 3001 --host"

timeout /t 3 /nobreak >nul
echo Opening Digital Twin Observatory in browser...
start http://localhost:3001

echo.
echo Digital Twin is running:
echo - Dashboard UI: http://localhost:3001
echo - Telemetry WebSocket: ws://localhost:8080
echo - REST Health API: http://localhost:8080/api/telematics/health
echo.

