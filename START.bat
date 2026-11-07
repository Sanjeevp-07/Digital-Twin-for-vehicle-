@echo off
setlocal enabledelayedexpansion
title Connected Vehicle & Digital Twin - Universal Auto-Launcher
color 0a

echo ======================================================================
echo    CONNECTED VEHICLE SIMULATOR ^& CLOUD DIGITAL TWIN ECOSYSTEM
echo    Universal Auto-Launcher (Zero-Manual Setup)
echo ======================================================================
echo.

cd /d "%~dp0"

:: 1. Check if Node.js is installed on the system
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [NOTICE] Node.js was not detected on this machine.
    echo [NOTICE] Automatically switching to Standalone Zero-Install Mode...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server_powershell.ps1"
    goto end
)

echo [OK] Node.js detected:
node -v
echo.

:: 2. Auto-install Virtual Car dependencies if missing
if not exist "%~dp0node_modules\" (
    echo [SETUP] First-time setup: Installing Vehicle Simulator dependencies...
    echo (This only happens once and requires zero manual typing)
    call npm install
    if %errorlevel% neq 0 (
        echo [WARN] npm install encountered an issue. Falling back to Standalone Zero-Dependency runner...
        node standalone_server.js
        goto end
    )
) else (
    echo [OK] Vehicle Simulator dependencies are ready.
)

:: 3. Auto-install Digital Twin dependencies if missing
if not exist "%~dp0Digital Twin\node_modules\" (
    echo [SETUP] First-time setup: Installing Digital Twin dependencies...
    cd "%~dp0Digital Twin"
    call npm install
    cd /d "%~dp0"
) else (
    echo [OK] Digital Twin dependencies are ready.
)

echo.
echo ======================================================================
echo    Launching Connected Vehicle & Digital Twin Ecosystem...
echo ======================================================================
echo.

:: 4. Launch Cloud Telematics Broker & Health Backend (Port 8080)
echo [1/3] Starting Cloud Telematics Broker (Port 8080)...
start "Cloud Telematics Backend (Port 8080)" cmd /k "cd /d ""%~dp0Digital Twin"" && node server/cloud-backend.js"
timeout /t 2 /nobreak >nul

:: 5. Launch Virtual Car Simulator (Port 3000)
echo [2/3] Starting Virtual Car Simulator (Port 3000)...
start "Virtual Car Simulator (Port 3000)" cmd /k "cd /d ""%~dp0"" && npx vite --port 3000 --host"
timeout /t 2 /nobreak >nul

:: 6. Launch Digital Twin Monitoring Observatory (Port 3001)
echo [3/3] Starting Cloud Digital Twin Dashboard (Port 3001)...
start "Digital Twin Observatory (Port 3001)" cmd /k "cd /d ""%~dp0Digital Twin"" && npx vite --port 3001 --host"
timeout /t 2 /nobreak >nul

:: 7. Open Browser
echo.
echo [4/4] Opening both dashboards side-by-side in your default browser...
start http://localhost:3000
start http://localhost:3001

echo.
echo ======================================================================
echo    ALL SYSTEMS OPERATIONAL!
echo    - Virtual Car Simulator: http://localhost:3000
echo    - Cloud Digital Twin:    http://localhost:3001
echo    - Telematics WebSocket:  ws://localhost:8080
echo ======================================================================
echo You can keep this window open or close it. Press any key to exit.
pause >nul

:end

