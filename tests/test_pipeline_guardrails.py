import pytest
from state import state

def test_ansible_blocked_without_terraform(client):
    state.infrastructure["status"] = "not_provisioned"
    res = client.post("/api/ansible/deploy", json={
        "web_server": "nginx",
        "frontend_type": "react",
        "backend_type": "python",
        "database_type": "postgresql"
    })
    assert res.status_code == 400
    assert "Prerequisite Required" in res.json()["detail"]

def test_puppet_blocked_without_ansible(client):
    state.infrastructure["status"] = "ready"
    state.deployment["status"] = "not_deployed"
    res = client.post("/api/puppet/enforce")
    assert res.status_code == 400
    assert "Complete Step 2: Ansible Deployment first" in res.json()["detail"]

def test_nagios_blocked_without_puppet(client):
    state.infrastructure["status"] = "ready"
    state.deployment["status"] = "deployed"
    state.compliance["status"] = "pending"
    res = client.post("/api/nagios/probe")
    assert res.status_code == 400
    assert "Complete Step 3: Puppet Compliance first" in res.json()["detail"]

def test_concurrent_pipeline_conflict(client):
    state.is_running_pipeline = True
    state.current_action = "Terraform In Progress"
    res = client.post("/api/terraform/apply", json={"aws_region": "ap-south-1", "instance_type": "t3.micro"})
    assert res.status_code == 409
    assert "A pipeline step is already running" in res.json()["detail"]

