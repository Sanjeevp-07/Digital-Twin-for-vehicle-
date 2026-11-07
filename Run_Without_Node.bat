@echo off
title Connected Vehicle & Digital Twin - Zero Install Windows Runner
color 0b
echo ======================================================================
echo    CONNECTED VEHICLE ^& CLOUD DIGITAL TWIN ECOSYSTEM
echo    ZERO-INSTALL MODE: Running natively using Windows Built-In Engine
echo    No Node.js or third-party libraries required!
echo ======================================================================
echo.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server_powershell.ps1"
pause

