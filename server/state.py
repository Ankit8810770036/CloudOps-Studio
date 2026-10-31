import asyncio
import time
from typing import List, Dict, Any, Optional

class PlatformState:
    def __init__(self):
        # Mode: 'simulation' or 'live'
        self.mode: str = "simulation"
        
        # Cloud Configuration
        self.config = {
            "aws_region": "us-east-1",
            "instance_type": "t2.micro",
            "environment": "devops-production",
            "has_aws_keys": False,
            "aws_access_key": "",
            "aws_secret_key": ""
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

# Global singleton
state = PlatformState()
