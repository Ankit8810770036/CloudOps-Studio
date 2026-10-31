#!/usr/bin/env bash
# =====================================================================
# CloudOps Platform Launcher for Linux / macOS / WSL
# =====================================================================
set -e

echo "====================================================================="
echo "  CLOUDOPS PLATFORM: TERRAFORM, ANSIBLE, PUPPET, NAGIOS, AWS"
echo "====================================================================="
echo ""
echo "[1/2] Installing requirements..."
python3 -m pip install -r server/requirements.txt --quiet

echo "[2/2] Starting Orchestration Engine on http://127.0.0.1:8000 ..."
python3 server/app.py
