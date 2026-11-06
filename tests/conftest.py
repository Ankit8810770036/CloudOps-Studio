import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure server module is in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
server_path = str(BASE_DIR / "server")
if server_path not in sys.path:
    sys.path.insert(0, server_path)

from state import state
from app import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.fixture(autouse=True)
def reset_state():
    # Save original state properties
    orig_mode = state.mode
    orig_config = dict(state.config)
    orig_infra = dict(state.infrastructure)
    orig_deploy = dict(state.deployment)
    orig_comp = dict(state.compliance)
    orig_telem = dict(state.telemetry)
    orig_chaos = dict(state.chaos)
    orig_projects = list(state.projects)
    orig_logs = list(state.recent_logs)
    orig_running = state.is_running_pipeline

    yield

    # Restore state properties
    state.mode = orig_mode
    state.config = orig_config
    state.infrastructure = orig_infra
    state.deployment = orig_deploy
    state.compliance = orig_comp
    state.telemetry = orig_telem
    state.chaos = orig_chaos
    state.projects = orig_projects
    state.recent_logs = orig_logs
    state.is_running_pipeline = orig_running

