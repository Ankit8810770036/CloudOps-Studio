import asyncio
import os
import time
from typing import List, Dict, Any, Optional

class PlatformState:
    def __init__(self):
        # Mode: 'simulation' or 'live'
        self.mode: str = "simulation"
        
        # Cloud Configuration (Default: Asia Pacific (Mumbai) - ap-south-1)
        self.config = {
            "aws_region": os.environ.get("AWS_DEFAULT_REGION", "ap-south-1"),
            "instance_type": "t2.micro",
            "environment": "devops-production",
            "has_aws_keys": bool(os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY")),
            "aws_access_key": os.environ.get("AWS_ACCESS_KEY_ID", ""),
            "aws_secret_key": os.environ.get("AWS_SECRET_ACCESS_KEY", "")
        }
        
        # Full-Stack Customization Config (Frontend, Backend, Database)
        self.stack = {
            "preset": "custom", # 'python_fullstack', 'spring_enterprise', 'mern_stack', 'static_html', 'custom'
            "frontend": {
                "type": "react", # 'react', 'html', 'nodejs_ssr'
                "title": "CloudOps Operations Dashboard",
                "port": 80
            },
            "backend": {
                "type": "python", # 'python', 'java_springboot', 'nodejs', 'none'
                "framework": "FastAPI",
                "port": 8000,
                "health_endpoint": "/api/health"
            },
            "database": {
                "type": "postgresql", # 'postgresql', 'mysql', 'mongodb', 'sqlite', 'none'
                "engine": "PostgreSQL 15",
                "port": 5432,
                "db_name": "devops_db",
                "db_user": "app_user"
            }
        }
        
        # Custom Uploaded Code Packages (Polyglot: Node, Spring Boot, Python, React, etc.)
        self.custom_code: Dict[str, Any] = {
            "frontend": None,
            "backend": None
        }

        # Multi-Project Registry (Allows deploying multiple projects and switching between them)
        self.projects: List[Dict[str, Any]] = []
        self.active_project_id: Optional[str] = None
        
        # Step 1: Terraform Infrastructure
        self.infrastructure = {
            "status": "not_provisioned", # not_provisioned, provisioning, ready, destroyed, error
            "instance_id": None,
            "public_ip": None,
            "public_dns": None,
            "security_group": None,
            "vpc_id": None,
            "app_url": None,
            "ssh_command": None,
            "provisioned_at": None
        }
        
        # Step 2: Ansible Web Server & App Deployment
        self.deployment = {
            "status": "not_deployed", # not_deployed, deploying, deployed, failed
            "web_server": "nginx", # nginx or apache
            "deployed_app": "Full-Stack Web Application (React + Python + PostgreSQL)",
            "deployed_at": None,
            "response_code": None
        }
        
        # Step 3: Puppet Compliance & Drift Enforcement
        self.compliance = {
            "status": "pending", # pending, compliant, drift_detected, enforcing
            "last_enforced": None,
            "rules_enforced": [
                {"name": "SSH Hardening (No root password, MaxAuthTries 4)", "status": "active"},
                {"name": "System Compliance MOTD & Banner", "status": "active"},
                {"name": "Security Packages (fail2ban, ufw, htop)", "status": "active"},
                {"name": "Backend Daemon Supervision (Systemd)", "status": "active"},
                {"name": "Database Isolation (Bound to 127.0.0.1)", "status": "active"},
                {"name": "NRPE Monitoring Daemon & Multi-Tier Sensors", "status": "active"}
            ],
            "drift_count": 0
        }
        
        # Step 4: Nagios Monitoring Telemetry
        self.telemetry = {
            "overall_health": "UNKNOWN", # HEALTHY, WARNING, CRITICAL, UNKNOWN
            "last_check": None,
            "checks": {
                "ping": {"name": "Host Ping (ICMP)", "status": "UNKNOWN", "latency_ms": 0, "packet_loss": "0%"},
                "http": {"name": "Frontend Web Tier (Port 80)", "status": "UNKNOWN", "code": 0, "response_time_ms": 0},
                "backend_api": {"name": "Backend API Tier", "status": "UNKNOWN", "port": 8000, "latency_ms": 0},
                "database": {"name": "Database Tier", "status": "UNKNOWN", "engine": "PostgreSQL", "port": 5432},
                "ssh": {"name": "SSH Daemon (Port 22)", "status": "UNKNOWN", "port_open": False},
                "cpu": {"name": "CPU Utilization", "status": "UNKNOWN", "value": 0, "unit": "%"},
                "memory": {"name": "RAM Utilization", "status": "UNKNOWN", "value": 0, "unit": "%"},
                "disk": {"name": "Disk Usage (/)", "status": "UNKNOWN", "value": 0, "unit": "%"}
            },
            "alerts": [],
            "history": []
        }
        
        # Populate initial rolling baseline points
        init_t = int(time.time()) - 36
        for i in range(12):
            self.telemetry["history"].append({
                "time": time.strftime("%H:%M:%S", time.localtime(init_t + i * 3)),
                "cpu": 18.0 + (i % 4) * 2.1,
                "memory": 36.5 + (i % 3) * 1.2,
                "latency": 32.0 + (i % 5) * 2.3
            })
        
        # Chaos Failure Injection State
        self.chaos = {
            "active_fault": None, # None, 'http_down', 'backend_down', 'db_down', 'cpu_spike', 'config_tamper'
            "description": None,
            "injected_at": None
        }
        
        # Pipeline Locks
        self.is_running_pipeline: bool = False
        self.current_action: Optional[str] = None
        
        # Streaming Log Subscribers
        self.log_subscribers: List[asyncio.Queue] = []
        self.recent_logs: List[Dict[str, Any]] = []

    def add_log(self, text: str, stream: str = "stdout", stage: str = "SYSTEM"):
        # Security sanitization: strip any AWS secrets before logging or broadcasting
        sec = self.config.get("aws_secret_key")
        if sec and len(sec) > 4 and sec in text:
            text = text.replace(sec, "****************")
        timestamp = time.strftime("%H:%M:%S")
        entry = {
            "timestamp": timestamp,
            "text": text,
            "stream": stream,
            "stage": stage
        }
        self.recent_logs.append(entry)
        if len(self.recent_logs) > 600:
            self.recent_logs.pop(0)
            
        for q in list(self.log_subscribers):
            try:
                q.put_nowait(entry)
            except Exception:
                pass

    def add_alert(self, severity: str, title: str, description: str, service: str):
        alert_entry = {
            "id": f"alert_{int(time.time()*1000)}",
            "timestamp": time.strftime("%H:%M:%S"),
            "severity": severity,
            "title": title,
            "description": description,
            "service": service
        }
        self.telemetry["alerts"].insert(0, alert_entry)
        if len(self.telemetry["alerts"]) > 20:
            self.telemetry["alerts"].pop()
            
        self.add_log(f"[{severity}] {title} - {description}", stream="stderr" if severity == "CRITICAL" else "stdout", stage="NAGIOS")

    def clear_alerts_for_service(self, service: str):
        self.telemetry["alerts"] = [a for a in self.telemetry["alerts"] if a["service"] != service]

    def record_telemetry_point(self, cpu: float, memory: float, latency: float):
        point = {
            "time": time.strftime("%H:%M:%S"),
            "cpu": round(max(0.0, float(cpu)), 1),
            "memory": round(max(0.0, float(memory)), 1),
            "latency": round(max(0.0, float(latency)), 1)
        }
        self.telemetry["history"].append(point)
        if len(self.telemetry["history"]) > 20:
            self.telemetry["history"].pop(0)

    def reset_on_destroy(self):
        self.infrastructure.update({
            "status": "destroyed",
            "instance_id": None,
            "public_ip": None,
            "public_dns": None,
            "security_group": None,
            "app_url": None,
            "ssh_command": None,
            "provisioned_at": None
        })
        self.deployment["status"] = "not_deployed"
        self.compliance.update({
            "status": "pending",
            "last_enforced": None,
            "drift_count": 0
        })
        for rule in self.compliance.get("rules_enforced", []):
            rule["status"] = "active"
        self.telemetry["overall_health"] = "UNKNOWN"
        self.telemetry["last_check"] = None
        self.telemetry["alerts"] = []
        for k in self.telemetry["checks"]:
            self.telemetry["checks"][k]["status"] = "UNKNOWN"
        self.chaos = {
            "active_fault": None,
            "description": None,
            "injected_at": None
        }

    def save_current_project(self, name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        ip = self.infrastructure.get("public_ip")
        if not ip:
            return None

        instance_id = self.infrastructure.get("instance_id") or f"i-{abs(hash(ip)) % 10000000:07d}"
        existing = next((p for p in self.projects if p.get("public_ip") == ip), None)
        if existing:
            existing.update({
                "region": self.config.get("aws_region", "ap-south-1"),
                "app_url": self.infrastructure.get("app_url") or f"http://{ip}",
                "stack": dict(self.stack),
                "deployed_app": self.deployment.get("deployed_app", "Full-Stack Web Application"),
                "status": "ready" if self.infrastructure.get("status") == "ready" else "degraded",
                "chaos_fault": self.chaos.get("active_fault")
            })
            if name:
                existing["name"] = name
            return existing

        proj_id = f"proj-{len(self.projects) + 1}"
        backend_name = self.stack.get("backend", {}).get("framework") or self.stack.get("backend", {}).get("type", "Web App").upper()
        default_name = f"Project {len(self.projects) + 1}: {backend_name} ({self.config.get('aws_region', 'ap-south-1')})"

        new_project = {
            "id": proj_id,
            "name": name or default_name,
            "created_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "region": self.config.get("aws_region", "ap-south-1"),
            "public_ip": ip,
            "instance_id": instance_id,
            "app_url": self.infrastructure.get("app_url") or f"http://{ip}",
            "stack": dict(self.stack),
            "deployed_app": self.deployment.get("deployed_app", "Full-Stack Web Application"),
            "status": "ready" if self.infrastructure.get("status") == "ready" else "provisioning",
            "chaos_fault": self.chaos.get("active_fault")
        }
        self.projects.append(new_project)
        self.active_project_id = proj_id
        return new_project

    def reset_for_new_project(self, project_name: Optional[str] = None):
        # 1. Archive current project to projects registry if it has an IP
        if self.infrastructure.get("public_ip"):
            self.save_current_project(name=project_name)

        # 2. Reset infrastructure, deployment, and monitoring pipeline wizard
        self.infrastructure.update({
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
        self.deployment.update({
            "status": "not_deployed",
            "web_server": "nginx",
            "deployed_app": "Full-Stack Web Application",
            "deployed_at": None,
            "response_code": None
        })
        self.compliance.update({
            "status": "pending",
            "last_enforced": None,
            "drift_count": 0
        })
        for rule in self.compliance.get("rules_enforced", []):
            rule["status"] = "active"

        self.telemetry["overall_health"] = "UNKNOWN"
        self.telemetry["last_check"] = None
        self.telemetry["alerts"] = []
        for k in self.telemetry["checks"]:
            self.telemetry["checks"][k]["status"] = "UNKNOWN"

        self.chaos = {
            "active_fault": None,
            "description": None,
            "injected_at": None
        }
        self.custom_code = {
            "frontend": None,
            "backend": None
        }
        self.is_running_pipeline = False
        self.current_action = None
        self.active_project_id = None
        self.add_log("[PROJECT WIZARD] 🚀 Started New Project Deployment session. Pipeline wizard reset for new project configuration.", stage="SYSTEM")

    def switch_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        target = next((p for p in self.projects if p["id"] == project_id), None)
        if not target:
            return None
        self.active_project_id = project_id
        self.infrastructure["public_ip"] = target.get("public_ip")
        self.infrastructure["instance_id"] = target.get("instance_id")
        self.infrastructure["app_url"] = target.get("app_url")
        self.infrastructure["status"] = "ready"
        if "stack" in target and isinstance(target["stack"], dict):
            self.stack = dict(target["stack"])
        if target.get("chaos_fault"):
            self.chaos["active_fault"] = target["chaos_fault"]
        else:
            self.chaos["active_fault"] = None
            self.chaos["description"] = None
        self.add_log(f"[CHAOS MONITOR] 🎯 Switched active target node to {target['name']} ({target.get('public_ip')}).", stage="CHAOS")
        return target

    def delete_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        target = next((p for p in self.projects if p["id"] == project_id or p.get("public_ip") == project_id), None)
        if not target:
            if (project_id == "proj-current" or project_id == self.infrastructure.get("public_ip")) and self.infrastructure.get("public_ip"):
                target = {
                    "id": "proj-current",
                    "name": "Current Deployment",
                    "public_ip": self.infrastructure.get("public_ip"),
                    "instance_id": self.infrastructure.get("instance_id")
                }
            else:
                return None

        # Remove from projects array if present
        self.projects = [p for p in self.projects if p["id"] != target.get("id") and p.get("public_ip") != target.get("public_ip")]

        # If deleted project was the currently active one
        is_active = (self.active_project_id == target.get("id")) or (self.infrastructure.get("public_ip") == target.get("public_ip"))
        if is_active:
            if self.projects:
                next_proj = self.projects[0]
                self.switch_project(next_proj["id"])
            else:
                self.active_project_id = None
                self.infrastructure.update({
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
                self.deployment.update({
                    "status": "not_deployed",
                    "web_server": "nginx",
                    "deployed_app": "Full-Stack Web Application",
                    "deployed_at": None,
                    "response_code": None
                })
                self.compliance.update({
                    "status": "pending",
                    "last_enforced": None,
                    "drift_count": 0
                })
                self.telemetry["overall_health"] = "UNKNOWN"
                self.chaos = {
                    "active_fault": None,
                    "description": None,
                    "injected_at": None
                }

        self.add_log(f"[PROJECT REGISTRY] 🗑️ Project '{target.get('name')}' ({target.get('public_ip')}) deleted.", stage="SYSTEM")
        return target

# Global singleton
state = PlatformState()
