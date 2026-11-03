import asyncio
import json
import shutil
import zipfile
import tarfile
import io
import time
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

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
    frontend_type: Optional[str] = "react" # 'react', 'html', 'nodejs_ssr'
    backend_type: Optional[str] = "python" # 'python', 'java_springboot', 'nodejs', 'none'
    database_type: Optional[str] = "postgresql" # 'postgresql', 'mysql', 'mongodb', 'sqlite', 'none'

class WebAppContentRequest(BaseModel):
    html: str

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
        "stack": state.stack,
        "deployment": state.deployment,
        "compliance": state.compliance,
        "telemetry": state.telemetry,
        "chaos": state.chaos,
        "custom_code": state.custom_code
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

# Polyglot Project Code Upload Endpoints (Node.js, Spring Boot, Python, React, Folder / Zip)
BASE_PROJECT_DIR = Path(__file__).resolve().parent.parent

@app.post("/api/upload/code")
async def upload_code(
    target_tier: str = Form(...),      # 'frontend' or 'backend'
    framework: str = Form(...),        # 'nodejs', 'springboot', 'python', 'react', 'html', etc.
    files: List[UploadFile] = File(...),
    paths: Optional[str] = Form(None)  # JSON array of relative paths for folder uploads
):
    path_list = []
    if paths:
        try:
            path_list = json.loads(paths)
        except Exception:
            path_list = []

    # Map target tier & framework to destination directory in Ansible roles
    if target_tier == "frontend":
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "webapp" / "files" / "app"
    elif framework == "nodejs":
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_nodejs" / "files" / "app"
    elif framework in ["springboot", "java"]:
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_java" / "files" / "app"
    elif framework == "python":
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_python" / "files" / "app"
    elif framework in ["docker", "custom", "polyglot"]:
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_docker" / "files" / "app"
    else:
        target_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_docker" / "files" / "app"

    target_dir.mkdir(parents=True, exist_ok=True)

    saved_files = []
    total_size = 0

    for idx, f in enumerate(files):
        filename = f.filename or f"file_{idx}"
        rel_path = path_list[idx] if idx < len(path_list) and path_list[idx] else filename

        # Strip common top-level folder name if uploading a folder
        parts = Path(rel_path).parts
        if len(parts) > 1 and parts[0] not in [".", ".."]:
            clean_rel_path = Path(*parts[1:])
        else:
            clean_rel_path = Path(rel_path).name

        content = await f.read()
        total_size += len(content)

        # 1. Zip Archive Auto-Extraction
        if filename.lower().endswith(".zip"):
            try:
                with zipfile.ZipFile(io.BytesIO(content)) as z:
                    for member in z.infolist():
                        if not member.is_dir() and not member.filename.startswith("__MACOSX"):
                            member_parts = Path(member.filename).parts
                            if len(member_parts) > 1 and member_parts[0] not in [".", ".."]:
                                dest_item = target_dir / Path(*member_parts[1:])
                            else:
                                dest_item = target_dir / Path(member.filename)
                            if not dest_item.resolve().is_relative_to(target_dir.resolve()):
                                continue
                            dest_item.parent.mkdir(parents=True, exist_ok=True)
                            with z.open(member) as source, open(dest_item, "wb") as dest:
                                shutil.copyfileobj(source, dest)
                            saved_files.append(str(dest_item.relative_to(target_dir)))
            except Exception as e:
                state.add_log(f"Zip extraction warning: {str(e)}", stream="stderr", stage="ANSIBLE")

        # 2. Tar/Gzip Archive Auto-Extraction
        elif filename.lower().endswith((".tar.gz", ".tgz")):
            try:
                with tarfile.open(fileobj=io.BytesIO(content), mode="r:gz") as t:
                    for member in t.getmembers():
                        if member.isfile():
                            member_parts = Path(member.name).parts
                            if len(member_parts) > 1:
                                dest_item = target_dir / Path(*member_parts[1:])
                            else:
                                dest_item = target_dir / Path(member.name)
                            if not dest_item.resolve().is_relative_to(target_dir.resolve()):
                                continue
                            dest_item.parent.mkdir(parents=True, exist_ok=True)
                            f_obj = t.extractfile(member)
                            if f_obj:
                                with open(dest_item, "wb") as dest:
                                    shutil.copyfileobj(f_obj, dest)
                                saved_files.append(str(dest_item.relative_to(target_dir)))
            except Exception as e:
                state.add_log(f"Tar extraction warning: {str(e)}", stream="stderr", stage="ANSIBLE")

        # 3. Spring Boot Executable JAR
        elif filename.lower().endswith(".jar") and framework in ["springboot", "java"]:
            dest_file = target_dir / "app.jar"
            dest_file.write_bytes(content)
            saved_files.append("app.jar")

        # 4. Individual File or Preserved Subfolder File
        else:
            dest_file = target_dir / clean_rel_path
            if not dest_file.resolve().is_relative_to(target_dir.resolve()):
                continue
            dest_file.parent.mkdir(parents=True, exist_ok=True)
            dest_file.write_bytes(content)
            saved_files.append(str(clean_rel_path))

    file_count = len(saved_files)
    
    # Check for Dockerfile presence (Auto-detection for polyglot apps: Go, Rust, Ruby, PHP, .NET, Python, etc.)
    has_dockerfile = any(
        Path(f).name.lower() in ["dockerfile", "dockerfile.prod", "dockerfile.dev"]
        for f in saved_files
    )

    effective_framework = framework
    if has_dockerfile:
        effective_framework = "docker"
        docker_role_dir = BASE_PROJECT_DIR / "ansible" / "roles" / "backend_docker" / "files" / "app"
        docker_role_dir.mkdir(parents=True, exist_ok=True)
        # If extracted in a different dir, ensure files are synced to backend_docker
        if target_dir != docker_role_dir and target_dir.exists():
            for item in target_dir.rglob("*"):
                if item.is_file():
                    rel = item.relative_to(target_dir)
                    d_dest = docker_role_dir / rel
                    d_dest.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(item, d_dest)
        
        state.stack["backend"]["type"] = "docker"
        state.stack["backend"]["port"] = 8000
        state.add_log(
            "[Auto-Detection] 🐳 Dockerfile detected in uploaded package! Universal containerization enabled. "
            "App will be built and supervised via Docker with Restart=always on port 8000.",
            stage="ANSIBLE"
        )

    state.custom_code[target_tier] = {
        "framework": effective_framework,
        "has_dockerfile": has_dockerfile,
        "file_count": file_count,
        "total_size_bytes": total_size,
        "files": saved_files[:50],
        "uploaded_at": time.strftime("%Y-%m-%d %H:%M:%S")
    }

    state.add_log(
        f"[Code Upload] Uploaded {file_count} file(s) for {effective_framework.upper()} ({round(total_size / 1024, 1)} KB). Target Tier: {target_tier.upper()}",
        stage="ANSIBLE"
    )

    return {
        "status": "success",
        "target_tier": target_tier,
        "framework": effective_framework,
        "has_dockerfile": has_dockerfile,
        "file_count": file_count,
        "total_size_bytes": total_size,
        "files": saved_files[:50]
    }

@app.get("/api/upload/status")
async def get_upload_status():
    return state.custom_code

@app.delete("/api/upload/code/{tier}")
async def clear_uploaded_code(tier: str):
    if tier not in ["frontend", "backend"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    if tier == "frontend":
        d = BASE_PROJECT_DIR / "ansible" / "roles" / "webapp" / "files" / "app"
        if d.exists():
            for item in d.iterdir():
                if item.name not in ["index.html", "style.css", "app.js"]: # keep default webapp template files
                    if item.is_dir():
                        shutil.rmtree(item, ignore_errors=True)
                    else:
                        item.unlink(missing_ok=True)
    else:
        for r in ["backend_nodejs", "backend_java", "backend_python", "backend_docker"]:
            d = BASE_PROJECT_DIR / "ansible" / "roles" / r / "files" / "app"
            if d.exists():
                shutil.rmtree(d, ignore_errors=True)

    state.custom_code[tier] = None
    state.add_log(f"Cleared custom uploaded code for {tier.upper()}. Reverted to default template.", stage="ANSIBLE")
    return {"status": "cleared", "tier": tier}

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

from fastapi.staticfiles import StaticFiles

client_dist = Path(__file__).resolve().parent.parent / "client" / "dist"
if client_dist.exists():
    app.mount("/", StaticFiles(directory=str(client_dist), html=True), name="static_client")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
