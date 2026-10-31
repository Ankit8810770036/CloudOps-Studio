@echo off
title CloudOps Platform - Automated Cloud Infrastructure & Config Engine
echo =====================================================================
echo   CLOUDOPS PLATFORM: TERRAFORM, ANSIBLE, PUPPET, NAGIOS, AWS
echo =====================================================================
echo.
echo [1/3] Checking Python dependencies...
python -m pip install -r server\requirements.txt --quiet
echo [2/3] Starting CloudOps Orchestration Server on http://127.0.0.1:8000 ...
start "" http://127.0.0.1:8000
echo.
echo [3/3] Platform is running! Press Ctrl+C in this terminal to stop.
python server\app.py
pause

