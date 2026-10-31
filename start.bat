@echo off
title CloudOps Platform - Automated Cloud Infrastructure & Config Engine
echo =====================================================================
echo   CLOUDOPS PLATFORM: TERRAFORM, ANSIBLE, PUPPET, NAGIOS, AWS
echo =====================================================================
echo.
echo [1/3] Checking Python dependencies...
python -m pip install -r server\requirements.txt --quiet

echo [2/3] Checking port 8000 availability...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    echo Freeing port 8000 from existing process (PID %%a)...
    taskkill /F /PID %%a >nul 2>&1
)

echo [3/3] Starting CloudOps Orchestration Server on http://127.0.0.1:8000 ...
start "" http://127.0.0.1:8000
echo.
echo Platform is running! Press Ctrl+C in this terminal to stop.
python server\app.py
pause

