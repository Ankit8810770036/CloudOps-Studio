import pytest
from state import state

def test_chaos_inject_http_down(client):
    state.mode = "simulation"
    res = client.post("/api/chaos/inject", json={"fault_type": "http_down"})
    assert res.status_code == 200
    data = res.json()
    assert data["fault"] == "http_down"
    assert state.chaos["active_fault"] == "http_down"
    assert state.telemetry["checks"]["http"]["status"] == "CRITICAL"

def test_chaos_inject_config_tamper(client):
    state.mode = "simulation"
    res = client.post("/api/chaos/inject", json={"fault_type": "config_tamper"})
    assert res.status_code == 200
    assert state.compliance["status"] == "drift_detected"
    assert state.compliance["drift_count"] > 0

def test_chaos_heal(client):
    state.mode = "simulation"
    # Inject fault first
    client.post("/api/chaos/inject", json={"fault_type": "http_down"})
    assert state.chaos["active_fault"] == "http_down"

    # Heal
    res = client.post("/api/chaos/heal")
    assert res.status_code == 200
    assert state.chaos["active_fault"] is None
    assert state.telemetry["checks"]["http"]["status"] == "OK"

