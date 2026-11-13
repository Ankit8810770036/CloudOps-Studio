import asyncio
import os
import sys
import json
import shutil
import io
import time
import copy
from pathlib import Path

# Ensure server directory is always in sys.path regardless of execution root
server_dir = str(Path(__file__).resolve().parent)
if server_dir not in sys.path:
    sys.path.insert(0, server_dir)
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.types import Scope
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import BaseModel
from typing import Optional, List

from state import state
from simulator import simulator
from live_runner import live_engine

# Continuous background poller for Nagios health monitoring
async def nagios_background_poller():
    while True:
        try:
            # Poll live/simulated telemetry once infrastructure is ready and deployment + compliance have been established
            if (
                state.infrastructure.get("status") == "ready"
                and state.deployment.get("status") == "deployed"
                and state.compliance.get("status") == "compliant"
            ):
                if state.mode == "simulation":
                    await simulator.run_nagios_probe()
                else:
                    await live_engine.run_nagios_probe()
        except Exception:
            pass
        await asyncio.sleep(4)

CREDENTIALS_FILE = Path(__file__).resolve().parent / ".credentials.json"

def load_persisted_credentials():
    if os.environ.get("TESTING") == "true":
        return
    if CREDENTIALS_FILE.exists():
        try:
            with open(CREDENTIALS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                access = (data.get("aws_access_key") or "").strip()
                secret = (data.get("aws_secret_key") or "").strip()
                token = (data.get("aws_session_token") or "").strip()
                region = (data.get("aws_region") or "").strip()
                if access:
                    state.config["aws_access_key"] = access
                    os.environ["AWS_ACCESS_KEY_ID"] = access
                if secret:
                    state.config["aws_secret_key"] = secret
                    os.environ["AWS_SECRET_ACCESS_KEY"] = secret
                if token:
                    state.config["aws_session_token"] = token
                    os.environ["AWS_SESSION_TOKEN"] = token
                if region:
                    state.config["aws_region"] = region
                    os.environ["AWS_DEFAULT_REGION"] = region
                is_dummy = access in ("AKIAIOSFODNN7EXAMPLE", "")
                has_access = bool(access and not is_dummy)
                has_secret = bool(secret and not is_dummy)
                state.config["has_aws_keys"] = bool(has_access and has_secret)
        except Exception:
            pass

def save_persisted_credentials():
    if os.environ.get("TESTING") == "true":
        return
    try:
        data = {
            "aws_access_key": state.config.get("aws_access_key", ""),
            "aws_secret_key": state.config.get("aws_secret_key", ""),
            "aws_session_token": state.config.get("aws_session_token", ""),
            "aws_region": state.config.get("aws_region", "ap-south-1")
        }
        with open(CREDENTIALS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass

def sync_terraform_state_if_available():
    tfstate_file = Path(__file__).resolve().parent.parent / "terraform" / "terraform.tfstate"
    if tfstate_file.exists():
        try:
            with open(tfstate_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                outputs = data.get("outputs", {})
                pub_ip = outputs.get("public_ip", {}).get("value")
                instance_id = outputs.get("instance_id", {}).get("value")
                public_dns = outputs.get("public_dns", {}).get("value")
                sg = outputs.get("security_group_id", {}).get("value")
                ssh_cmd = outputs.get("ssh_command", {}).get("value")
                app_url = outputs.get("app_url", {}).get("value")
                if pub_ip and instance_id and pub_ip != "null" and instance_id != "null":
                    # Check if this instance was explicitly deleted by the user
                    if (pub_ip in state.deleted_project_ips or
                        "proj-live-aws" in state.deleted_project_ids or
                        instance_id in state.deleted_project_ids):
                        return None
                    return {
                        "status": "ready",
                        "instance_id": instance_id,
                        "public_ip": pub_ip,
                        "public_dns": public_dns or f"ec2-{pub_ip.replace('.', '-')}.ap-south-1.compute.amazonaws.com",
                        "security_group": sg or "sg-081669aebce291917",
                        "vpc_id": "vpc-0a817f9b42c13d80a",
                        "app_url": app_url or f"http://{pub_ip}",
                        "ssh_command": ssh_cmd or f"ssh -i terraform/devops-key.pem ubuntu@{pub_ip}",
                        "provisioned_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    }
        except Exception:
            pass
    return None

def register_live_project_if_available():
    live_tf = sync_terraform_state_if_available()
    if not live_tf:
        return None
    live_id = "proj-live-aws"
    if live_id in state.deleted_project_ids or live_tf["public_ip"] in state.deleted_project_ips:
        return None
    existing = next((p for p in state.projects if p.get("id") == live_id or p.get("public_ip") == live_tf["public_ip"]), None)
    if not existing:
        live_proj = {
            "id": live_id,
            "mode": "live",
            "name": f"Live AWS EC2 ({live_tf['instance_id']})",
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "region": state.config.get("aws_region", "ap-south-1"),
            "public_ip": live_tf["public_ip"],
            "instance_id": live_tf["instance_id"],
            "public_dns": live_tf["public_dns"],
            "security_group": live_tf["security_group"],
            "vpc_id": live_tf.get("vpc_id", "vpc-0a817f9b42c13d80a"),
            "ssh_command": live_tf["ssh_command"],
            "provisioned_at": live_tf["provisioned_at"],
            "app_url": live_tf["app_url"],
            "status": "ready",
            "stack": copy.deepcopy(state.stack),
            "deployment": {
                "status": "deployed",
                "web_server": "nginx",
                "deployed_app": "Production Web App",
                "deployed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "response_code": 200
            },
            "compliance": {
                "status": "compliant",
                "last_enforced": time.strftime("%Y-%m-%d %H:%M:%S"),
                "rules_enforced": copy.deepcopy(state.compliance.get("rules_enforced", [])),
                "drift_count": 0
            },
            "telemetry": copy.deepcopy(state.telemetry),
            "chaos": {"active_fault": None, "description": None, "injected_at": None},
            "chaos_fault": None
        }
        state.projects.append(live_proj)
        state._init_project_telemetry(live_proj)
        return live_proj
    return existing

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load any saved credentials across server reboots
    load_persisted_credentials()
    # Auto-detect existing live Terraform instance if available
    live_tf = sync_terraform_state_if_available()
    if live_tf:
        register_live_project_if_available()
        state.add_log(f"[Auto-Detect] Registered active AWS EC2 instance {live_tf['instance_id']} ({live_tf['public_ip']}) in projects registry.", stage="SYSTEM")
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
    aws_region: Optional[str] = None
    instance_type: Optional[str] = None
    environment: Optional[str] = None
    aws_access_key: Optional[str] = None
    aws_secret_key: Optional[str] = None
    aws_session_token: Optional[str] = None

class ProvisionRequest(BaseModel):
    aws_region: Optional[str] = "us-east-1"
    instance_type: Optional[str] = "t2.micro"

class DeployRequest(BaseModel):
    web_server: Optional[str] = "nginx" # 'nginx' or 'apache'
    frontend_type: Optional[str] = "react" # 'react', 'html', 'nodejs_ssr'
    backend_type: Optional[str] = "python" # 'python', 'java_springboot', 'nodejs', 'none'
    database_type: Optional[str] = "postgresql" # 'postgresql', 'mysql', 'mongodb', 'sqlite', 'none'

class WebAppContentRequest(BaseModel):
    html: str

class ChaosRequest(BaseModel):
    fault_type: str # 'http_down', 'cpu_spike', 'config_tamper'

class NewProjectRequest(BaseModel):
    name: Optional[str] = None

class SwitchProjectRequest(BaseModel):
    project_id: str

# 1. State & Status
@app.get("/api/status")
async def get_status():
    if state.infrastructure.get("public_ip") and not state.projects:
        state.save_current_project()
    return {
        "mode": state.mode,
        "is_running_pipeline": state.is_running_pipeline,
        "current_action": state.current_action,
        "infrastructure": state.infrastructure,
        "stack": state.stack,
        "deployment": state.deployment,
        "compliance": state.compliance,
        "telemetry": state.telemetry,
        "chaos": state.chaos,
        "custom_code": state.custom_code,
        "projects": state.projects,
        "active_project_id": state.active_project_id
    }

# 1.1 Multi-Project Registry & Switching Endpoints
@app.get("/api/projects")
async def list_projects():
    if state.infrastructure.get("public_ip") and not state.projects:
        state.save_current_project()
    return {
        "projects": state.projects,
        "active_project_id": state.active_project_id
    }

@app.post("/api/project/new")
async def create_new_project(req: Optional[NewProjectRequest] = None):
    name = req.name if req else None
    state.reset_for_new_project(project_name=name)
    return {
        "status": "ok",
        "message": "Deployment wizard reset for new project",
        "projects": state.projects,
        "active_project_id": state.active_project_id
    }

@app.post("/api/projects/switch")
async def switch_project_endpoint(req: SwitchProjectRequest):
    target = state.switch_project(req.project_id)
    if not target:
        raise HTTPException(status_code=404, detail="Project not found in deployed registry")

    engine = simulator if state.mode == "simulation" else live_engine
    await engine.run_nagios_probe()
    return {
        "status": "ok",
        "active_project_id": state.active_project_id,
        "project": target,
        "telemetry": state.telemetry
    }

@app.delete("/api/projects/{project_id}")
async def delete_project_endpoint(project_id: str):
    deleted = state.delete_project(project_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Project not found in deployed registry")
    return {
        "status": "ok",
        "message": f"Project {project_id} deleted successfully",
        "deleted_project": deleted,
        "projects": state.projects,
        "active_project_id": state.active_project_id
    }

# 2. Toggle Mode (Live AWS vs Simulation)
@app.post("/api/mode")
async def set_mode(req: ModeRequest):
    if req.mode not in ["simulation", "live"]:
        raise HTTPException(status_code=400, detail="Mode must be 'simulation' or 'live'")
        
    if req.mode == "live":
        access_key = (state.config.get("aws_access_key") or "").strip()
        secret_key = (state.config.get("aws_secret_key") or "").strip()
        is_dummy = access_key == "AKIAIOSFODNN7EXAMPLE"
        if not access_key or not secret_key or is_dummy:
            err_msg = "AWS Credentials Required: Cannot switch to LIVE MODE. Default AWS Region (ap-south-1), AWS Access Key ID, and AWS Secret Access Key must be configured first."
            state.add_log(f"[WARNING] {err_msg}", stage="SYSTEM", stream="stderr")
            raise HTTPException(
                status_code=400,
                detail=err_msg
            )

        # Save active simulation project state if valid and not deleted
        if state.mode == "simulation" and state.infrastructure.get("status") == "ready":
            state.save_current_project()

        state.mode = "live"
        
        # 1. Look for existing, non-deleted live project
        live_proj = next(
            (p for p in state.projects 
             if (p.get("id") == "proj-live-aws" or p.get("mode") == "live") 
             and p.get("id") not in state.deleted_project_ids 
             and p.get("public_ip") not in state.deleted_project_ips), 
            None
        )
        
        if live_proj:
            state.switch_project(live_proj["id"])
            state.add_log(f"[Live AWS Mode] Connected to live AWS project: {live_proj.get('instance_id')} at {live_proj.get('public_ip')}.", stage="TERRAFORM")
            asyncio.create_task(live_engine.run_nagios_probe())
        else:
            live_tf = sync_terraform_state_if_available()
            if live_tf and "proj-live-aws" not in state.deleted_project_ids and live_tf["public_ip"] not in state.deleted_project_ips:
                reg_proj = register_live_project_if_available()
                state.infrastructure.update(live_tf)
                state.deployment["status"] = "deployed"
                state.deployment["response_code"] = 200
                state.compliance["status"] = "compliant"
                state.active_project_id = reg_proj["id"] if reg_proj else "proj-live-aws"
                state.add_log(f"[Live AWS Mode] Connected to live AWS EC2 instance: {live_tf['instance_id']} at {live_tf['public_ip']}.", stage="TERRAFORM")
                asyncio.create_task(live_engine.run_nagios_probe())
            else:
                state.active_project_id = None
                state.infrastructure.update({
                    "status": "not_provisioned",
                    "instance_id": None,
                    "public_ip": None,
                    "public_dns": None,
                    "security_group": None,
                    "vpc_id": None,
                    "app_url": None,
                    "ssh_command": None,
                    "provisioned_at": None
                })
                state.deployment.update({
                    "status": "not_deployed",
                    "web_server": "nginx",
                    "deployed_app": "Production Web App",
                    "deployed_at": None,
                    "response_code": None
                })
                state.compliance.update({
                    "status": "pending",
                    "last_enforced": None,
                    "drift_count": 0
                })
                state.telemetry["overall_health"] = "UNKNOWN"
                state.telemetry["alerts"] = []
                state.chaos = {
                    "active_fault": None,
                    "description": None,
                    "injected_at": None
                }
                state.add_log("Switched to LIVE AWS MODE. No EC2 instance provisioned yet; use Step 1 to deploy.", stage="SYSTEM")
    else:
        # Switching from Live to Simulation
        if state.mode == "live" and state.infrastructure.get("status") == "ready":
            state.save_current_project()

        state.mode = "simulation"
        sim_proj = next(
            (p for p in state.projects 
             if p.get("id") != "proj-live-aws" 
             and p.get("id") not in state.deleted_project_ids 
             and p.get("public_ip") not in state.deleted_project_ips), 
            None
        )
        if sim_proj:
            state.switch_project(sim_proj["id"])
            state.add_log(f"Switched to SIMULATION MODE (Safe sandbox). Loaded project: {sim_proj.get('name')}.", stage="SYSTEM")
        else:
            state.active_project_id = None
            state.infrastructure.update({
                "status": "not_provisioned",
                "instance_id": None,
                "public_ip": None,
                "public_dns": None,
                "security_group": None,
                "vpc_id": None,
                "app_url": None,
                "ssh_command": None,
                "provisioned_at": None
            })
            state.deployment.update({
                "status": "not_deployed",
                "web_server": "nginx",
                "deployed_app": "Full-Stack Web Application",
                "deployed_at": None,
                "response_code": None
            })
            state.compliance.update({
                "status": "pending",
                "last_enforced": None,
                "drift_count": 0
            })
            state.telemetry["overall_health"] = "UNKNOWN"
            state.telemetry["alerts"] = []
            state.chaos = {
                "active_fault": None,
                "description": None,
                "injected_at": None
            }
            state.add_log("Switched to SIMULATION MODE (Safe sandbox).", stage="SYSTEM")

    return {"status": "ok", "mode": state.mode}

# 3. Cloud Configuration
@app.get("/api/config")
async def get_config():
    access_key = state.config.get("aws_access_key", "")
    secret_key = state.config.get("aws_secret_key", "")
    session_token = state.config.get("aws_session_token", "")
    is_dummy = access_key == "AKIAIOSFODNN7EXAMPLE"
    has_access = bool(access_key and not is_dummy)
    has_secret = bool(secret_key and not is_dummy)
    masked_secret = f"{secret_key[:4]}...{secret_key[-4:]}" if has_secret else ""
    return {
        "aws_region": state.config.get("aws_region", "ap-south-1"),
        "instance_type": state.config.get("instance_type", "t2.micro"),
        "environment": state.config.get("environment", "devops-production"),
        "has_aws_keys": bool(has_access and has_secret),
        "has_access_key": has_access,
        "has_secret_key": has_secret,
        "has_session_token": bool(session_token),
        "aws_access_key": access_key if not is_dummy else "",
        "aws_secret_key_masked": masked_secret,
        "is_temporary_key": access_key.startswith("ASIA")
    }

@app.post("/api/config")
async def update_config(req: ConfigRequest):
    if req.aws_region and req.aws_region.strip():
        state.config["aws_region"] = req.aws_region.strip()
    if req.instance_type and req.instance_type.strip():
        state.config["instance_type"] = req.instance_type.strip()
    if req.environment and req.environment.strip():
        state.config["environment"] = req.environment.strip()
    # Only update access key if non-empty string provided, preventing inadvertent wipe
    if req.aws_access_key is not None and req.aws_access_key.strip():
        state.config["aws_access_key"] = req.aws_access_key.strip()
    # Only update secret key if non-empty string provided
    if req.aws_secret_key is not None and req.aws_secret_key.strip():
        state.config["aws_secret_key"] = req.aws_secret_key.strip()
    # Only update session token if non-empty string provided
    if req.aws_session_token is not None and req.aws_session_token.strip():
        state.config["aws_session_token"] = req.aws_session_token.strip()
        
    access_key = state.config.get("aws_access_key", "")
    secret_key = state.config.get("aws_secret_key", "")
    session_token = state.config.get("aws_session_token", "")
    is_dummy = access_key in ("AKIAIOSFODNN7EXAMPLE", "")
    has_access = bool(access_key and not is_dummy)
    has_secret = bool(secret_key and not is_dummy)
    state.config["has_aws_keys"] = bool(has_access and has_secret)
    
    if state.config["has_aws_keys"]:
        os.environ["AWS_ACCESS_KEY_ID"] = access_key
        os.environ["AWS_SECRET_ACCESS_KEY"] = secret_key
        if session_token:
            os.environ["AWS_SESSION_TOKEN"] = session_token
        else:
            os.environ.pop("AWS_SESSION_TOKEN", None)
        os.environ["AWS_DEFAULT_REGION"] = state.config.get("aws_region", "ap-south-1")
    
    # Persist credentials to disk so they survive server restarts
    save_persisted_credentials()
    
    state.add_log(f"Cloud configuration updated: Region={state.config['aws_region']}, Type={state.config['instance_type']}", stage="SYSTEM")

    masked_secret = f"{secret_key[:4]}...{secret_key[-4:]}" if has_secret and len(secret_key) >= 8 else ("****" if has_secret else "")
    return {
        "status": "ok",
        "config": {
            "aws_region": state.config.get("aws_region", "ap-south-1"),
            "instance_type": state.config.get("instance_type", "t2.micro"),
            "environment": state.config.get("environment", "devops-production"),
            "has_aws_keys": bool(has_access and has_secret),
            "has_access_key": has_access,
            "has_secret_key": has_secret,
            "has_session_token": bool(session_token),
            "aws_access_key": access_key if not is_dummy else "",
            "aws_secret_key_masked": masked_secret,
            "is_temporary_key": access_key.startswith("ASIA")
        }
    }

# 4. Terraform Endpoints
@app.post("/api/terraform/apply")
async def apply_terraform(req: ProvisionRequest):
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")

    # If provisioning fresh, unmark deleted live project IDs so new live deployment is accepted
    if state.mode == "live":
        state.deleted_project_ids.discard("proj-live-aws")

    target_region = req.aws_region if (req.aws_region and req.aws_region != "us-east-1") else state.config.get("aws_region", "ap-south-1")
    state.is_running_pipeline = True
    state.current_action = "Terraform IaC Provisioning"
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_terraform_apply(region=target_region, instance_type=req.instance_type or "t2.micro"))
    return {"status": "started", "action": "terraform_apply", "region": target_region}

@app.post("/api/terraform/destroy")
async def destroy_terraform():
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
        
    state.is_running_pipeline = True
    state.current_action = "Terraform Infrastructure Teardown"
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_terraform_destroy())
    return {"status": "started", "action": "terraform_destroy"}

# 5. Ansible Deployment Endpoint
@app.post("/api/ansible/deploy")
async def deploy_ansible(req: DeployRequest):
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
    if state.infrastructure.get("status") != "ready":
        err_msg = "Prerequisite Required: Cannot start Step 2 (Ansible Deployment). Complete Step 1: Terraform IaC first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="ANSIBLE", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)
        
    state.is_running_pipeline = True
    state.current_action = f"Ansible Deployment [{req.frontend_type.upper()} + {req.backend_type.upper()} + {req.database_type.upper()}]"
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_ansible_deploy(
        web_server=req.web_server,
        frontend_type=req.frontend_type,
        backend_type=req.backend_type,
        database_type=req.database_type
    ))
    return {
        "status": "started",
        "action": "ansible_deploy",
        "web_server": req.web_server,
        "frontend": req.frontend_type,
        "backend": req.backend_type,
        "database": req.database_type
    }

# Custom Website Management Endpoints
WEBAPP_INDEX = Path(__file__).resolve().parent.parent / "ansible" / "roles" / "webapp" / "files" / "app" / "index.html"

@app.get("/api/webapp/content")
async def get_webapp_content():
    if WEBAPP_INDEX.exists():
        return {"html": WEBAPP_INDEX.read_text(encoding="utf-8")}
    return {"html": "<h1>Hello World!</h1>"}

@app.post("/api/webapp/content")
async def set_webapp_content(req: WebAppContentRequest):
    WEBAPP_INDEX.parent.mkdir(parents=True, exist_ok=True)
    WEBAPP_INDEX.write_text(req.html, encoding="utf-8")
    state.add_log("Custom HTML website updated in ansible/roles/webapp/files/app/index.html", stage="ANSIBLE")
    return {"status": "saved"}

@app.get("/api/webapp/preview", response_class=HTMLResponse)
async def preview_webapp():
    if WEBAPP_INDEX.exists():
        return WEBAPP_INDEX.read_text(encoding="utf-8")
    return "<h1>Hello World!</h1>"

BASE_PROJECT_DIR = Path(__file__).resolve().parent.parent

# 6. Puppet Compliance Endpoint
@app.post("/api/puppet/enforce")
async def enforce_puppet():
    if state.is_running_pipeline:
        raise HTTPException(status_code=409, detail=f"A pipeline step is already running: {state.current_action}")
    if state.infrastructure.get("status") != "ready":
        err_msg = "Prerequisite Required: Cannot start Step 3 (Puppet Compliance). Complete Step 1: Terraform IaC first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="PUPPET", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)
    if state.deployment.get("status") != "deployed":
        err_msg = "Prerequisite Required: Cannot start Step 3 (Puppet Compliance). Complete Step 2: Ansible Deployment first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="PUPPET", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)
        
    state.is_running_pipeline = True
    state.current_action = "Puppet Multi-Tier Compliance"
    state.compliance["status"] = "enforcing"
    engine = simulator if state.mode == "simulation" else live_engine
    asyncio.create_task(engine.run_puppet_enforce())
    return {"status": "started", "action": "puppet_enforce"}

# 7. Nagios Telemetry Probing
@app.post("/api/nagios/probe")
async def probe_nagios():
    if state.infrastructure.get("status") != "ready":
        err_msg = "Prerequisite Required: Cannot probe Step 4 (Nagios Observability). Complete Step 1: Terraform IaC first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="NAGIOS", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)
    if state.deployment.get("status") != "deployed":
        err_msg = "Prerequisite Required: Cannot probe Step 4 (Nagios Observability). Complete Step 2: Ansible Deployment first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="NAGIOS", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)
    if state.compliance.get("status") != "compliant":
        err_msg = "Prerequisite Required: Cannot probe Step 4 (Nagios Observability). Complete Step 3: Puppet Compliance first (manually)."
        state.add_log(f"[GUARDRAIL] {err_msg}", stage="NAGIOS", stream="stderr")
        raise HTTPException(status_code=400, detail=err_msg)

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
    await engine.heal_chaos()
    return {"status": "ok", "chaos": state.chaos}

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

from fastapi.staticfiles import StaticFiles

class MergedStaticFiles(StaticFiles):
    """
    Dual-serving static handler:
    1. Checks CloudOps Studio client UI build first (client/dist)
    2. Transparently falls back to user deployed webapp assets (ansible/roles/webapp/files/app)
       so custom React bundles, stylesheets, and media load with zero 404s.
    """
    def __init__(self, *args, fallback_dir: Optional[Path] = None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fallback_dir = fallback_dir

    async def get_response(self, path: str, scope: Scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404 and self.fallback_dir:
                try:
                    full_path = (self.fallback_dir / path).resolve()
                    if full_path.is_file() and full_path.is_relative_to(self.fallback_dir.resolve()):
                        stat_result = os.stat(full_path)
                        return self.file_response(str(full_path), stat_result, scope)
                except Exception:
                    pass
            raise exc

client_dist = BASE_PROJECT_DIR / "client" / "dist"
webapp_app_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "webapp" / "files" / "app"

if client_dist.exists():
    app.mount("/", MergedStaticFiles(directory=str(client_dist), fallback_dir=webapp_app_dir, html=True), name="static_client")
elif webapp_app_dir.exists():
    app.mount("/", StaticFiles(directory=str(webapp_app_dir), html=True), name="static_client")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
