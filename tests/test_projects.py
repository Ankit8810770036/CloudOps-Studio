import pytest
from state import state

def test_list_projects(client):
    state.projects = [
        {
            "id": "proj-1",
            "name": "Project 1: React App",
            "created_at": "2026-11-06 12:00:00",
            "region": "ap-south-1",
            "public_ip": "54.210.88.142",
            "status": "ready"
        }
    ]
    state.active_project_id = "proj-1"

    res = client.get("/api/projects")
    assert res.status_code == 200
    data = res.json()
    assert len(data["projects"]) == 1
    assert data["projects"][0]["name"] == "Project 1: React App"
    assert data["active_project_id"] == "proj-1"

def test_new_project_resets_wizard_and_archives_existing(client):
    state.projects = []
    state.infrastructure["public_ip"] = "3.108.40.123"
    state.infrastructure["status"] = "ready"
    state.deployment["status"] = "deployed"
    state.compliance["status"] = "compliant"

    res = client.post("/api/project/new", json={"name": "Project 1 - Live Node"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert len(data["projects"]) == 1
    assert data["projects"][0]["public_ip"] == "3.108.40.123"

    # Wizard state is reset for the new project
    assert state.infrastructure["status"] == "not_provisioned"
    assert state.infrastructure["public_ip"] is None
    assert state.deployment["status"] == "not_deployed"
    assert state.compliance["status"] == "pending"

def test_switch_project_endpoint(client):
    state.projects = [
        {
            "id": "proj-1",
            "name": "Node Service",
            "public_ip": "13.232.10.50",
            "status": "ready"
        },
        {
            "id": "proj-2",
            "name": "Python Service",
            "public_ip": "13.232.10.51",
            "status": "ready"
        }
    ]
    state.mode = "simulation"

    res = client.post("/api/projects/switch", json={"project_id": "proj-2"})
    assert res.status_code == 200
    data = res.json()
    assert data["active_project_id"] == "proj-2"
    assert state.infrastructure["public_ip"] == "13.232.10.51"

def test_switch_project_not_found(client):
    state.projects = []
    res = client.post("/api/projects/switch", json={"project_id": "non-existent-proj"})
    assert res.status_code == 404

