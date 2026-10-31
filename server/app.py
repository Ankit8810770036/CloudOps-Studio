import asyncio
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from state import state
from simulator import simulator
from live_runner import live_engine

# Continuous background poller for Nagios health monitoring
async def nagios_background_poller():
    while True:
        try:
            if state.infrastructure.get("status") == "ready":
                if state.mode == "simulation":
                    await simulator.run_nagios_probe()
                else:
                    await live_engine.run_nagios_probe()
        except Exception as e:
            pass
        await asyncio.sleep(4)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background telemetry task
    poller_task = asyncio.create_task(nagios_background_poller())
    state.add_log("DevOps Platform Orchestration Server started on port 8000.", stage="SYSTEM")
    state.add_log(f"Current Execution Mode: [{state.mode.upper()}] (Toggleable in UI)", stage="SYSTEM")
    yield
    poller_task.cancel()

app = FastAPI(
    title="CloudOps Automation API",
    description="Backend API for Terraform, Ansible, Puppet, and Nagios Cloud Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class ModeRequest(BaseModel):
    mode: str # 'simulation' or 'live'

class ConfigRequest(BaseModel):
    aws_region: Optional[str] = "us-east-1"
    instance_type: Optional[str] = "t2.micro"
    environment: Optional[str] = "devops-production"
    aws_access_key: Optional[str] = ""
    aws_secret_key: Optional[str] = ""

class ProvisionRequest(BaseModel):
    aws_region: Optional[str] = "us-east-1"
    instance_type: Optional[str] = "t2.micro"

class DeployRequest(BaseModel):
    web_server: Optional[str] = "nginx" # 'nginx' or 'apache'

class ChaosRequest(BaseModel):
    fault_type: str # 'http_down', 'cpu_spike', 'config_tamper'

# 1. State & Status
@app.get("/api/status")
async def get_status():
    return {
        "mode": state.mode,
        "is_running_pipeline": state.is_running_pipeline,
        "current_action": state.current_action,
        "infrastructure": state.infrastructure,
        "deployment": state.deployment,
        "compliance": state.compliance,
        "telemetry": state.telemetry,
        "chaos": state.chaos
    }

# 2. Toggle Mode (Live AWS vs Simulation)
@app.post("/api/mode")
async def set_mode(req: ModeRequest):
    if req.mode not in ["simulation", "live"]:
        raise HTTPException(status_code=400, detail="Mode must be 'simulation' or 'live'")
    state.mode = req.mode
    state.add_log(f"Execution Mode changed to [{state.mode.upper()}].", stage="SYSTEM")
    return {"status": "ok", "mode": state.mode}

# 3. Cloud Configuration
@app.get("/api/config")
async def get_config():
    # Return masked secret
    masked_secret = f"{state.config['aws_secret_key'][:4]}...{state.config['aws_secret_key'][-4:]}" if state.config.get("aws_secret_key") else ""
    return {
        "aws_region": state.config["aws_region"],
        "instance_type": state.config["instance_type"],
        "environment": state.config["environment"],
        "has_aws_keys": bool(state.config.get("aws_access_key")),
        "aws_access_key": state.config.get("aws_access_key", ""),
        "aws_secret_key_masked": masked_secret
    }

@app.post("/api/config")
async def update_config(req: ConfigRequest):
    if req.aws_region: state.config["aws_region"] = req.aws_region
    if req.instance_type: state.config["instance_type"] = req.instance_type
    if req.environment: state.config["environment"] = req.environment
    if req.aws_access_key: state.config["aws_access_key"] = req.aws_access_key
    if req.aws_secret_key: state.config["aws_secret_key"] = req.aws_secret_key
    state.config["has_aws_keys"] = bool(state.config.get("aws_access_key"))
    
    state.add_log(f"Cloud configuration updated: Region={state.config['aws_region']}, Type={state.config['instance_type']}", stage="SYSTEM")
    return {"status": "ok", "config": state.config}

# 4. Terraform Endpoints
@app.post("/api/terraform/apply")
async def apply_terraform(req: ProvisionRequest):
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
        
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_terraform_apply(region=req.aws_region, instance_type=req.instance_type))
    return {"status": "started", "action": "terraform_apply"}

@app.post("/api/terraform/destroy")
async def destroy_terraform():
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
        
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_terraform_destroy())
    return {"status": "started", "action": "terraform_destroy"}

# 5. Ansible Deployment Endpoint
@app.post("/api/ansible/deploy")
async def deploy_ansible(req: DeployRequest):
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
    if state.infrastructure.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Cannot deploy: Infrastructure is not ready. Provision with Terraform first.")
        
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_ansible_deploy(web_server=req.web_server))
    return {"status": "started", "action": "ansible_deploy", "web_server": req.web_server}

# 6. Puppet Compliance Endpoint
@app.post("/api/puppet/enforce")
async def enforce_puppet():
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
    if state.infrastructure.get("status") != "ready":
        raise HTTPException(status_code=400, detail="Cannot enforce compliance: Infrastructure is not ready.")
        
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_puppet_enforce())
    return {"status": "started", "action": "puppet_enforce"}

# 7. Nagios Telemetry Probing
@app.post("/api/nagios/probe")
async def probe_nagios():
    engine = simulator if state.mode == "simulation" else live_engine
    await engine.run_nagios_probe()
    return {"status": "ok", "telemetry": state.telemetry}

# 8. Chaos Engineering / Fault Injection Endpoints
@app.post("/api/chaos/inject")
async def inject_chaos(req: ChaosRequest):
    engine = simulator if state.mode == "simulation" else live_engine
    await engine.inject_chaos(req.fault_type)
    return {"status": "injected", "fault": req.fault_type, "chaos": state.chaos}

@app.post("/api/chaos/heal")
async def heal_chaos():
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.heal_chaos())
    return {"status": "healing"}

# 9. Log History & Management
@app.get("/api/logs")
async def get_logs():
    return {"logs": state.recent_logs}

@app.post("/api/logs/clear")
async def clear_logs():
    state.recent_logs.clear()
    state.add_log("Terminal buffer cleared.", stage="SYSTEM")
    return {"status": "cleared"}

# 10. WebSocket for Live Streaming Terminal
@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()
    q = asyncio.Queue()
    state.log_subscribers.append(q)
    
    # Send backlog of recent logs on initial connection
    try:
        for item in state.recent_logs[-80:]:
            await websocket.send_text(json.dumps(item))
            
        while True:
            item = await q.get()
            await websocket.send_text(json.dumps(item))
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        if q in state.log_subscribers:
            state.log_subscribers.remove(q)

from pathlib import Path
from fastapi.staticfiles import StaticFiles

client_dist = Path(__file__).resolve().parent.parent / "client" / "dist"
if client_dist.exists():
    app.mount("/", StaticFiles(directory=str(client_dist), html=True), name="static_client")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
