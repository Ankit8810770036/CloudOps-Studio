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
            "deployed_app": "CloudOps Operations Portal v1.0",
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
                {"name": "NRPE Monitoring Daemon & Plugins", "status": "active"},
                {"name": "Web Root Permissions (/var/www/devops_app 0755)", "status": "active"}
            ],
            "drift_count": 0
        }
        
        # Step 4: Nagios Monitoring Telemetry
        self.telemetry = {
            "overall_health": "UNKNOWN", # HEALTHY, WARNING, CRITICAL, UNKNOWN
            "last_check": None,
            "checks": {
                "ping": {"name": "Host Ping (ICMP)", "status": "UNKNOWN", "latency_ms": 0, "packet_loss": "0%"},
                "http": {"name": "HTTP Service (Port 80)", "status": "UNKNOWN", "code": 0, "response_time_ms": 0},
                "ssh": {"name": "SSH Daemon (Port 22)", "status": "UNKNOWN", "port_open": False},
                "cpu": {"name": "CPU Utilization", "status": "UNKNOWN", "value": 0, "unit": "%"},
                "memory": {"name": "RAM Utilization", "status": "UNKNOWN", "value": 0, "unit": "%"},
                "disk": {"name": "Disk Usage (/)", "status": "UNKNOWN", "value": 0, "unit": "%"}
            },
            "alerts": []
        }
        
        # Chaos Failure Injection State
        self.chaos = {
            "active_fault": None, # None, 'http_down', 'cpu_spike', 'config_tamper'
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
            
        # Broadcast to all connected WebSockets
        for q in list(self.log_subscribers):
            try:
                q.put_nowait(entry)
            except Exception:
                pass

    def add_alert(self, severity: str, title: str, description: str, service: str):
        alert_entry = {
            "id": f"alert_{int(time.time()*1000)}",
            "timestamp": time.strftime("%H:%M:%S"),
            "severity": severity, # WARNING, CRITICAL, INFO
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

# Global singleton
state = PlatformState()
