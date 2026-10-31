import os
import sys
import json
import socket
import asyncio
import subprocess
import paramiko
import requests
import time
from pathlib import Path
from state import state

BASE_DIR = Path(__file__).resolve().parent.parent
TF_DIR = BASE_DIR / "terraform"
ANSIBLE_DIR = BASE_DIR / "ansible"
PUPPET_DIR = BASE_DIR / "puppet"
KEY_FILE = TF_DIR / "devops-key.pem"

class LiveEngine:
    def get_aws_env(self):
        env = os.environ.copy()
        if state.config.get("aws_access_key"):
            env["AWS_ACCESS_KEY_ID"] = state.config["aws_access_key"]
        if state.config.get("aws_secret_key"):
            env["AWS_SECRET_ACCESS_KEY"] = state.config["aws_secret_key"]
        if state.config.get("aws_region"):
            env["AWS_DEFAULT_REGION"] = state.config["aws_region"]
        return env

    async def run_terraform_apply(self, region: str = "us-east-1", instance_type: str = "t2.micro"):
        state.is_running_pipeline = True
        state.current_action = "Terraform Live Provisioning"
        state.infrastructure["status"] = "provisioning"
        
        state.add_log(f"[Terraform Live] Initializing in {TF_DIR}...", stage="TERRAFORM")
        env = self.get_aws_env()
        env["TF_VAR_aws_region"] = region
        env["TF_VAR_instance_type"] = instance_type
        
        # 1. Terraform Init
        init_proc = await asyncio.create_subprocess_exec(
            "terraform", "init", "-no-color",
            cwd=str(TF_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        async def read_stream(stream, is_err=False):
            while True:
                line = await stream.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace').rstrip()
                if text:
                    state.add_log(text, stream="stderr" if is_err else "stdout", stage="TERRAFORM")
                    
        await asyncio.gather(
            read_stream(init_proc.stdout, False),
            read_stream(init_proc.stderr, True)
        )
        await init_proc.wait()
        
        if init_proc.returncode != 0:
            state.infrastructure["status"] = "error"
            state.is_running_pipeline = False
            state.add_log(f"[Terraform Error] terraform init failed with exit code {init_proc.returncode}", stream="stderr", stage="TERRAFORM")
            return

        # 2. Terraform Apply
        state.add_log("[Terraform Live] Executing: terraform apply -auto-approve...", stage="TERRAFORM")
        apply_proc = await asyncio.create_subprocess_exec(
            "terraform", "apply", "-auto-approve", "-no-color",
            cwd=str(TF_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        await asyncio.gather(
            read_stream(apply_proc.stdout, False),
            read_stream(apply_proc.stderr, True)
        )
        await apply_proc.wait()
        
        if apply_proc.returncode == 0:
            # Query outputs
            out_proc = subprocess.run(["terraform", "output", "-json"], cwd=str(TF_DIR), capture_output=True, text=True, env=env)
            if out_proc.returncode == 0:
                try:
                    data = json.loads(out_proc.stdout)
                    ip = data.get("public_ip", {}).get("value")
                    instance_id = data.get("instance_id", {}).get("value")
                    dns = data.get("public_dns", {}).get("value")
                    sg = data.get("security_group_id", {}).get("value")
                    
                    state.infrastructure.update({
                        "status": "ready",
                        "instance_id": instance_id,
                        "public_ip": ip,
                        "public_dns": dns,
                        "security_group": sg,
                        "app_url": f"http://{ip}",
                        "ssh_command": f"ssh -i terraform/devops-key.pem ubuntu@{ip}",
                        "provisioned_at": time.strftime("%Y-%m-%d %H:%M:%S")
                    })
                    state.add_log(f"✔ Live AWS Instance ready! Public IP: {ip}", stage="TERRAFORM")
                except Exception as e:
                    state.add_log(f"Error parsing terraform output: {e}", stream="stderr", stage="TERRAFORM")
        else:
            state.infrastructure["status"] = "error"
            state.add_log(f"Terraform apply failed with code {apply_proc.returncode}", stream="stderr", stage="TERRAFORM")
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_terraform_destroy(self):
        state.is_running_pipeline = True
        state.current_action = "Terraform Live Destroy"
        state.infrastructure["status"] = "destroying"
        
        env = self.get_aws_env()
        destroy_proc = await asyncio.create_subprocess_exec(
            "terraform", "destroy", "-auto-approve", "-no-color",
            cwd=str(TF_DIR),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            env=env
        )
        
        async def read_stream(stream, is_err=False):
            while True:
                line = await stream.readline()
                if not line:
                    break
                text = line.decode('utf-8', errors='replace').rstrip()
                if text:
                    state.add_log(text, stream="stderr" if is_err else "stdout", stage="TERRAFORM")
                    
        await asyncio.gather(
            read_stream(destroy_proc.stdout, False),
            read_stream(destroy_proc.stderr, True)
        )
        await destroy_proc.wait()
        
        state.infrastructure.update({
            "status": "destroyed",
            "instance_id": None,
            "public_ip": None,
            "public_dns": None,
            "security_group": None,
            "app_url": None,
            "ssh_command": None,
            "provisioned_at": None
        })
        state.deployment["status"] = "not_deployed"
        state.is_running_pipeline = False
        state.current_action = None

    def execute_ssh_command(self, host: str, command: str, key_path: str = None):
        key_path = key_path or str(KEY_FILE)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        
        try:
            k = paramiko.RSAKey.from_private_key_file(key_path)
            ssh.connect(host, username="ubuntu", pkey=k, timeout=20)
            stdin, stdout, stderr = ssh.exec_command(command)
            out = stdout.read().decode('utf-8', errors='replace')
            err = stderr.read().decode('utf-8', errors='replace')
            ssh.close()
            return True, out, err
        except Exception as e:
            return False, "", str(e)

    async def run_ansible_deploy(self, web_server: str = "nginx", frontend_type: str = "react", backend_type: str = "python", database_type: str = "postgresql"):
        state.is_running_pipeline = True
        state.current_action = f"Ansible Live Deploy [{frontend_type.upper()} + {backend_type.upper()} + {database_type.upper()}]"
        state.deployment["status"] = "deploying"
        state.deployment["web_server"] = web_server
        
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            state.add_log("Error: No provisioned EC2 instance IP found. Please run Terraform first.", stream="stderr", stage="ANSIBLE")
            state.deployment["status"] = "failed"
            state.is_running_pipeline = False
            return

        state.add_log(f"Connecting to AWS EC2 instance [{target_ip}] over SSH...", stage="ANSIBLE")
        
        # Test SSH readiness (EC2 can take 30s to boot)
        for attempt in range(1, 10):
            success, _, err = self.execute_ssh_command(target_ip, "echo SSH_READY")
            if success:
                state.add_log(f"SSH connection established on attempt {attempt}.", stage="ANSIBLE")
                break
            state.add_log(f"Waiting for EC2 SSH port to be ready... (Attempt {attempt}/10)", stage="ANSIBLE")
            await asyncio.sleep(6)
            
        # 1. Custom File Injection & Dependency Manifests
        py_req_file = ANSIBLE_DIR / "roles" / "backend_python" / "files" / "app" / "requirements.txt"
        node_pkg_file = ANSIBLE_DIR / "roles" / "backend_nodejs" / "files" / "app" / "package.json"

        backend_dep_cmd = ""
        if backend_type == "python":
            backend_dep_cmd = """
            sudo apt-get install -y python3 python3-pip python3-venv
            sudo mkdir -p /opt/devops_backend
            sudo python3 -m venv /opt/devops_backend/venv
            sudo /opt/devops_backend/venv/bin/pip install --upgrade pip fastapi uvicorn[standard] pydantic requests
            """
            if py_req_file.exists():
                req_content = py_req_file.read_text(encoding="utf-8")
                backend_dep_cmd += f"""
                sudo bash -c 'cat << "EOF" > /opt/devops_backend/requirements.txt
{req_content}
EOF'
                echo "Installing custom Python libraries from requirements.txt..."
                sudo /opt/devops_backend/venv/bin/pip install -r /opt/devops_backend/requirements.txt
                """
        elif backend_type == "nodejs":
            backend_dep_cmd = """
            sudo apt-get install -y nodejs npm
            sudo mkdir -p /opt/devops_node
            """
            if node_pkg_file.exists():
                pkg_content = node_pkg_file.read_text(encoding="utf-8")
                backend_dep_cmd += f"""
                sudo bash -c 'cat << "EOF" > /opt/devops_node/package.json
{pkg_content}
EOF'
                echo "Installing custom Node.js libraries from package.json..."
                cd /opt/devops_node && sudo npm install --production
                """
        elif backend_type == "java_springboot":
            backend_dep_cmd = """
            sudo apt-get install -y openjdk-17-jdk-headless
            sudo mkdir -p /opt/devops_springboot
            """

        # Execute deployment on target node
        deploy_cmd = f"""
        sudo apt-get update -y
        sudo apt-get install -y {web_server} curl ufw htop
        sudo systemctl enable {web_server}
        sudo systemctl start {web_server}
        sudo mkdir -p /var/www/devops_app
        sudo chown -R www-data:www-data /var/www/devops_app
        sudo bash -c 'cat << "EOF" > /var/www/devops_app/index.html
        { (ANSIBLE_DIR / "roles/webapp/files/app/index.html").read_text(encoding="utf-8") }
        EOF'
        sudo bash -c 'cat << "EOF" > /var/www/devops_app/style.css
        { (ANSIBLE_DIR / "roles/webapp/files/app/style.css").read_text(encoding="utf-8") }
        EOF'
        sudo bash -c 'cat << "EOF" > /var/www/devops_app/app.js
        { (ANSIBLE_DIR / "roles/webapp/files/app/app.js").read_text(encoding="utf-8") }
        EOF'
        sudo bash -c 'echo \'{{"status":"UP","web_server":"{web_server}","hostname":"\'$(hostname)\'","deployed_by":"Ansible"}}\' > /var/www/devops_app/healthz.json'
        if [ "{web_server}" = "nginx" ]; then
            sudo sed -i 's|root /var/www/html;|root /var/www/devops_app;|g' /etc/nginx/sites-available/default
            sudo systemctl reload nginx
        else
            sudo sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/devops_app|g' /etc/apache2/sites-available/000-default.conf
            sudo systemctl reload apache2
        fi

        {backend_dep_cmd}

        sudo ufw allow 80/tcp
        sudo ufw allow 22/tcp
        """
        
        state.add_log(f"Executing Ansible role setup for {web_server.upper()} and web application assets...", stage="ANSIBLE")
        success, out, err = self.execute_ssh_command(target_ip, deploy_cmd)
        
        if success:
            state.add_log(out if out else "Configuration script completed successfully.", stage="ANSIBLE")
            state.deployment.update({
                "status": "deployed",
                "web_server": web_server,
                "deployed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
                "response_code": 200
            })
            state.add_log(f"✔ Ansible: Successfully deployed application at http://{target_ip}", stage="ANSIBLE")
        else:
            state.add_log(f"Ansible deployment failed: {err}", stream="stderr", stage="ANSIBLE")
            state.deployment["status"] = "failed"
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_puppet_enforce(self):
        state.is_running_pipeline = True
        state.current_action = "Puppet Live Compliance"
        state.compliance["status"] = "enforcing"
        
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            state.add_log("Error: Target IP not available.", stream="stderr", stage="PUPPET")
            state.compliance["status"] = "failed"
            state.is_running_pipeline = False
            return
            
        state.add_log(f"Applying Puppet security baseline manifest on node [{target_ip}]...", stage="PUPPET")
        
        puppet_cmd = """
        sudo apt-get install -y fail2ban nagios-nrpe-server monitoring-plugins
        sudo bash -c 'cat << "EOF" > /etc/motd
===============================================================
 DEVOPS AUTOMATED CLOUD INFRASTRUCTURE - NODE COMPLIANCE
 Managed By: Puppet Configuration Enforcement Engine
 Status    : Active & Hardened
===============================================================
EOF'
        sudo bash -c 'cat << "EOF" > /etc/ssh/sshd_config.d/99-hardened.conf
MaxAuthTries 4
X11Forwarding no
ClientAliveInterval 300
EOF'
        sudo systemctl restart ssh
        sudo systemctl enable nagios-nrpe-server
        sudo systemctl start nagios-nrpe-server
        """
        
        success, out, err = self.execute_ssh_command(target_ip, puppet_cmd)
        if success:
            state.add_log("✔ Puppet: Security baseline and drift policies enforced successfully.", stage="PUPPET")
            state.compliance.update({
                "status": "compliant",
                "last_enforced": time.strftime("%Y-%m-%d %H:%M:%S"),
                "drift_count": 0
            })
        else:
            state.add_log(f"Puppet compliance enforcement failed: {err}", stream="stderr", stage="PUPPET")
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_nagios_probe(self):
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            return
            
        state.telemetry["last_check"] = time.strftime("%H:%M:%S")
        
        # 1. Check HTTP
        try:
            start_t = time.time()
            resp = requests.get(f"http://{target_ip}/healthz.json", timeout=4)
            lat = round((time.time() - start_t) * 1000, 1)
            if resp.status_code == 200:
                state.telemetry["checks"]["http"] = {
                    "name": "HTTP Service (Port 80)",
                    "status": "OK",
                    "code": 200,
                    "response_time_ms": lat
                }
            else:
                state.telemetry["checks"]["http"] = {
                    "name": "HTTP Service (Port 80)",
                    "status": "CRITICAL",
                    "code": resp.status_code,
                    "response_time_ms": lat
                }
        except Exception:
            state.telemetry["checks"]["http"] = {
                "name": "HTTP Service (Port 80)",
                "status": "CRITICAL",
                "code": 0,
                "response_time_ms": 0
            }
            
        # 2. Check SSH
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        try:
            s.connect((target_ip, 22))
            s.close()
            state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "OK", "port_open": True}
        except Exception:
            state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "CRITICAL", "port_open": False}
            
        # 3. Remote Metrics via SSH
        success, out, _ = self.execute_ssh_command(target_ip, "cat /proc/loadavg && free -m | grep Mem && df -h / | tail -n 1")
        if success and out:
            lines = out.strip().split("\n")
            if len(lines) >= 3:
                # Load avg
                load_parts = lines[0].split()
                cpu_load = float(load_parts[0]) * 50.0 # scale roughly to percentage
                cpu_val = min(round(cpu_load, 1), 99.0)
                state.telemetry["checks"]["cpu"] = {"name": "CPU Utilization", "status": "OK" if cpu_val < 85 else "CRITICAL", "value": cpu_val, "unit": "%"}
                
                # Mem
                mem_parts = lines[1].split()
                total_mem = float(mem_parts[1])
                used_mem = float(mem_parts[2])
                mem_percent = round((used_mem / total_mem) * 100, 1)
                state.telemetry["checks"]["memory"] = {"name": "RAM Utilization", "status": "OK", "value": mem_percent, "unit": "%"}
                
                # Disk
                disk_parts = lines[2].split()
                disk_percent = float(disk_parts[4].replace("%", ""))
                state.telemetry["checks"]["disk"] = {"name": "Disk Usage (/)", "status": "OK", "value": disk_percent, "unit": "%"}
                
        # Overall
        if any(c.get("status") == "CRITICAL" for c in state.telemetry["checks"].values()):
            state.telemetry["overall_health"] = "CRITICAL"
        else:
            state.telemetry["overall_health"] = "HEALTHY"

    async def inject_chaos(self, fault_type: str):
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            return
            
        server = state.deployment.get("web_server", "nginx")
        state.chaos["active_fault"] = fault_type
        
        if fault_type == "http_down":
            state.add_log(f"[Chaos] Stopping web service (sudo systemctl stop {server}) on EC2...", stream="stderr", stage="CHAOS")
            self.execute_ssh_command(target_ip, f"sudo systemctl stop {server}")
            await self.run_nagios_probe()
            state.add_alert("CRITICAL", "Service Down: HTTP Stopped", f"{server.upper()} daemon stopped manually via chaos injector.", "http_service")
            
        elif fault_type == "cpu_spike":
            state.add_log("[Chaos] Spawning CPU stress workload on EC2...", stream="stderr", stage="CHAOS")
            self.execute_ssh_command(target_ip, "nohup python3 -c 'import time; [sum(i*i for i in range(1000000)) for _ in range(300)]' > /dev/null 2>&1 &")
            state.telemetry["checks"]["cpu"]["value"] = 95.0
            state.telemetry["checks"]["cpu"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", "High CPU Load Spike", "CPU utilization exceeded 90% threshold.", "cpu_utilization")

    async def heal_chaos(self):
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            return
            
        server = state.deployment.get("web_server", "nginx")
        state.add_log(f"[Heal] Restarting {server} and restoring baseline...", stage="SYSTEM")
        self.execute_ssh_command(target_ip, f"sudo systemctl restart {server} && sudo pkill -f 'python3 -c'")
        await asyncio.sleep(2)
        await self.run_nagios_probe()
        state.chaos["active_fault"] = None
        state.clear_alerts_for_service("http_service")
        state.clear_alerts_for_service("cpu_utilization")

live_engine = LiveEngine()

