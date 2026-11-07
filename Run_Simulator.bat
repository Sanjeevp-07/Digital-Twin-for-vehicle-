@echo off
cd /d "%~dp0"
title Real Engine & Car Simulator 3D
echo ===================================================
echo   REAL ENGINE & CAR SIMULATOR 3D (TRANSPARENT BODY)
echo   Combustion Sandbox & Fluid Flow Dynamics
echo ===================================================
echo.
echo Starting local web server on port 3000...
start http://localhost:3000
npm run dev
pause
