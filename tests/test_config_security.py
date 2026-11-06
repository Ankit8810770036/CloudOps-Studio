import pytest
from state import state

def test_config_masks_secret_key_on_get(client):
    state.config["aws_access_key"] = "AKIA1234567890EXAMPLE"
    state.config["aws_secret_key"] = "SuperSecretAWSKey123456789"
    state.config["has_aws_keys"] = True

    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert data["aws_access_key"] == "AKIA1234567890EXAMPLE"
    assert "SuperSecretAWSKey123456789" not in str(data)
    assert data["aws_secret_key_masked"] == "Supe...6789"

def test_config_masks_secret_key_on_post(client):
    res = client.post("/api/config", json={
        "aws_region": "ap-south-1",
        "instance_type": "t3.micro",
        "environment": "devops-testing",
        "aws_access_key": "AKIAVALIDKEY9999",
        "aws_secret_key": "MyTopSecretKey987654321"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "MyTopSecretKey987654321" not in str(data)
    assert data["config"]["aws_secret_key_masked"].startswith("MyTo")

def test_live_mode_toggle_requires_credentials(client):
    state.config["aws_access_key"] = ""
    state.config["aws_secret_key"] = ""
    state.config["has_aws_keys"] = False

    res = client.post("/api/mode", json={"mode": "live"})
    assert res.status_code == 400
    assert "AWS Credentials Required" in res.json()["detail"]

def test_log_sanitizer_redacts_secret_keys(client):
    state.config["aws_secret_key"] = "ACTUAL_SECRET_TOKEN_XYZ_99"
    state.add_log("Connecting using key ACTUAL_SECRET_TOKEN_XYZ_99 to AWS")

    last_log = state.recent_logs[-1]
    assert "ACTUAL_SECRET_TOKEN_XYZ_99" not in last_log["text"]
    assert "****************" in last_log["text"]

