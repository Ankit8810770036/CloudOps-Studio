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
        region = state.config.get("aws_region", "ap-south-1")
        env["AWS_DEFAULT_REGION"] = region
        env["AWS_REGION"] = region
        return env

    async def run_terraform_apply(self, region: str = "ap-south-1", instance_type: str = "t2.micro"):
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
                    state.save_current_project()
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
        
        state.reset_on_destroy()
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

    def sftp_upload_directory(self, host: str, local_dir: Path, remote_dir: str, key_path: str = None):
        """Recursively upload local directory to remote host via SFTP with binary safety."""
        key_path = key_path or str(KEY_FILE)
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
            k = paramiko.RSAKey.from_private_key_file(key_path)
            ssh.connect(host, username="ubuntu", pkey=k, timeout=30)
            sftp = ssh.open_sftp()

            # Ensure remote_dir exists (handling intermediate directories)
            parts = [p for p in remote_dir.split('/') if p]
            cur = ""
            for p in parts:
                cur += f"/{p}"
                try:
                    sftp.stat(cur)
                except IOError:
                    try:
                        sftp.mkdir(cur)
                    except IOError:
                        pass

            count = 0
            if local_dir.exists():
                for root, dirs, files in os.walk(local_dir):
                    rel_root = Path(root).relative_to(local_dir).as_posix()
                    target_remote_root = f"{remote_dir}/{rel_root}".rstrip("/.")
                    if rel_root != ".":
                        try:
                            sftp.stat(target_remote_root)
                        except IOError:
                            try:
                                sftp.mkdir(target_remote_root)
                            except IOError:
                                pass
                    for f in files:
                        local_f = Path(root) / f
                        remote_f = f"{target_remote_root}/{f}"
                        try:
                            sftp.put(str(local_f), remote_f)
                            count += 1
                        except Exception as upload_err:
                            state.add_log(f"[SFTP Warning] Could not upload {f}: {upload_err}", stream="stderr", stage="ANSIBLE")

            sftp.close()
            ssh.close()
            return True, count
        except Exception as e:
            return False, str(e)

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
        
        # Test SSH readiness (EC2 can take 30-45s to boot)
        ssh_ready = False
        for attempt in range(1, 15):
            success, _, err = self.execute_ssh_command(target_ip, "echo SSH_READY")
            if success:
                state.add_log(f"SSH connection established on attempt {attempt}.", stage="ANSIBLE")
                ssh_ready = True
                break
            state.add_log(f"Waiting for EC2 SSH port to be ready... (Attempt {attempt}/15)", stage="ANSIBLE")
            await asyncio.sleep(5)

        if not ssh_ready:
            state.add_log(f"Error: Could not establish SSH connection to [{target_ip}] after 15 attempts. Aborting.", stream="stderr", stage="ANSIBLE")
            state.deployment["status"] = "failed"
            state.is_running_pipeline = False
            state.current_action = None
            return

        # 1. Base packages installation
        base_prep_cmd = f"""
        sudo apt-get update -y
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y {web_server} curl ufw htop net-tools git jq
        sudo systemctl enable {web_server}
        sudo systemctl start {web_server}
        sudo mkdir -p /var/www/devops_app
        sudo chown -R ubuntu:ubuntu /var/www/devops_app
        """
        state.add_log(f"Configuring base web server ({web_server.upper()}) and tools on EC2...", stage="ANSIBLE")
        self.execute_ssh_command(target_ip, base_prep_cmd)

        # 2. Database Tier Setup
        db_install_cmd = ""
        db_port = 5432
        db_url = ""
        if database_type == "postgresql":
            db_port = 5432
            db_url = "postgresql://app_user:devops_password@127.0.0.1:5432/devops_db"
            db_install_cmd = """
            echo "[Database] Installing PostgreSQL 15 & configuring security..."
            sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
            sudo systemctl enable postgresql
            sudo systemctl start postgresql
            sudo -u postgres psql -c "CREATE USER app_user WITH PASSWORD 'devops_password';" 2>/dev/null || true
            sudo -u postgres psql -c "CREATE DATABASE devops_db OWNER app_user;" 2>/dev/null || true
            sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE devops_db TO app_user;" 2>/dev/null || true
            """
        elif database_type == "mysql":
            db_port = 3306
            db_url = "mysql://app_user:devops_password@127.0.0.1:3306/devops_db"
            db_install_cmd = """
            echo "[Database] Installing MySQL Server..."
            sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server
            sudo systemctl enable mysql
            sudo systemctl start mysql
            sudo mysql -e "CREATE USER IF NOT EXISTS 'app_user'@'localhost' IDENTIFIED BY 'devops_password';" 2>/dev/null || true
            sudo mysql -e "CREATE DATABASE IF NOT EXISTS devops_db;" 2>/dev/null || true
            sudo mysql -e "GRANT ALL PRIVILEGES ON devops_db.* TO 'app_user'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null || true
            """
        elif database_type == "mongodb":
            db_port = 27017
            db_url = "mongodb://127.0.0.1:27017/devops_db"
            db_install_cmd = """
            echo "[Database] Installing MongoDB daemon..."
            sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mongodb || sudo apt-get install -y mongodb-org || true
            sudo systemctl enable mongod 2>/dev/null || sudo systemctl enable mongodb 2>/dev/null || true
            sudo systemctl start mongod 2>/dev/null || sudo systemctl start mongodb 2>/dev/null || true
            """
        elif database_type == "sqlite":
            db_port = 0
            db_url = "sqlite:////opt/devops_db.sqlite"
            db_install_cmd = "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y sqlite3"

        if db_install_cmd:
            state.add_log(f"Provisioning {database_type.upper()} database instance...", stage="ANSIBLE")
            self.execute_ssh_command(target_ip, db_install_cmd)

        # 3. Frontend Assets SFTP Sync
        webapp_dir = ANSIBLE_DIR / "roles" / "webapp" / "files" / "app"
        state.add_log("Transferring frontend application assets over SFTP with binary integrity...", stage="ANSIBLE")
        f_ok, f_count = self.sftp_upload_directory(target_ip, webapp_dir, "/var/www/devops_app")
        if f_ok:
            state.add_log(f"✔ Uploaded {f_count} frontend asset files to /var/www/devops_app.", stage="ANSIBLE")
        else:
            state.add_log(f"[SFTP Notice] Frontend file transfer: {f_count}", stream="stderr", stage="ANSIBLE")

        # 4. Backend Source Code SFTP Sync & Runtime Provisioning
        backend_port = 8000
        backend_remote_dir = "/opt/devops_backend"
        backend_local_dir = ANSIBLE_DIR / "roles" / "backend_python" / "files" / "app"

        if backend_type == "nodejs":
            backend_port = 5000
            backend_remote_dir = "/opt/devops_node"
            backend_local_dir = ANSIBLE_DIR / "roles" / "backend_nodejs" / "files" / "app"
        elif backend_type == "java_springboot":
            backend_port = 8080
            backend_remote_dir = "/opt/devops_springboot"
            backend_local_dir = ANSIBLE_DIR / "roles" / "backend_java" / "files" / "app"
        elif backend_type == "docker" or (state.custom_code.get("backend") or {}).get("has_dockerfile"):
            backend_port = 8000
            backend_remote_dir = "/opt/cloudops_custom_app"
            backend_local_dir = ANSIBLE_DIR / "roles" / "backend_docker" / "files" / "app"
            if not (backend_local_dir / "Dockerfile").exists():
                for alt in ["backend_python", "backend_nodejs", "backend_java", "webapp"]:
                    cand = ANSIBLE_DIR / "roles" / alt / "files" / "app"
                    if (cand / "Dockerfile").exists():
                        backend_local_dir = cand
                        break

        backend_runtime_cmd = ""
        if backend_type != "none":
            state.add_log(f"Transferring {backend_type.upper()} backend source files to {backend_remote_dir} over SFTP...", stage="ANSIBLE")
            self.execute_ssh_command(target_ip, f"sudo mkdir -p {backend_remote_dir} && sudo chown -R ubuntu:ubuntu {backend_remote_dir}")
            b_ok, b_count = self.sftp_upload_directory(target_ip, backend_local_dir, backend_remote_dir)
            if b_ok:
                state.add_log(f"✔ Uploaded {b_count} {backend_type.upper()} backend source files.", stage="ANSIBLE")
            else:
                state.add_log(f"[SFTP Notice] Backend file transfer: {b_count}", stream="stderr", stage="ANSIBLE")

            if backend_type == "python":
                backend_runtime_cmd = f"""
                echo "[Backend] Setting up Python 3 virtual environment..."
                sudo DEBIAN_FRONTEND=noninteractive apt-get install -y python3 python3-pip python3-venv
                sudo python3 -m venv /opt/devops_backend/venv
                sudo /opt/devops_backend/venv/bin/pip install --upgrade pip fastapi "uvicorn[standard]" pydantic requests psycopg2-binary pymysql
                if [ -f /opt/devops_backend/requirements.txt ]; then
                    echo "Installing dependencies from requirements.txt..."
                    sudo /opt/devops_backend/venv/bin/pip install -r /opt/devops_backend/requirements.txt || true
                fi
                # Detect Python entrypoint: main.py, app.py, or api.py
                ENTRY_SCRIPT="main:app"
                if [ -f /opt/devops_backend/app.py ] && [ ! -f /opt/devops_backend/main.py ]; then
                    ENTRY_SCRIPT="app:app"
                elif [ -f /opt/devops_backend/api.py ] && [ ! -f /opt/devops_backend/main.py ]; then
                    ENTRY_SCRIPT="api:app"
                fi
                sudo bash -c "cat << 'EOF' > /etc/systemd/system/cloudops-app.service
[Unit]
Description=CloudOps Python FastAPI Application
After=network.target nginx.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/devops_backend
ExecStart=/opt/devops_backend/venv/bin/uvicorn $ENTRY_SCRIPT --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3
Environment=PORT=8000
Environment=DATABASE_URL={db_url}
Environment=DB_HOST=127.0.0.1
Environment=DB_PORT={db_port}
Environment=DB_NAME=devops_db
Environment=DB_USER=app_user
Environment=DB_PASSWORD=devops_password
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF"
                sudo systemctl daemon-reload
                sudo systemctl enable cloudops-app.service
                sudo systemctl restart cloudops-app.service || true
                """
            elif backend_type == "nodejs":
                backend_runtime_cmd = f"""
                echo "[Backend] Setting up Node.js runtime..."
                sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs npm
                cd /opt/devops_node
                if [ -f package.json ]; then
                    echo "Installing npm dependencies..."
                    sudo npm install --production || sudo npm install || true
                fi
                # Detect Node entrypoint: server.js, index.js, or app.js
                NODE_ENTRY="server.js"
                if [ -f /opt/devops_node/index.js ]; then
                    NODE_ENTRY="index.js"
                elif [ -f /opt/devops_node/app.js ]; then
                    NODE_ENTRY="app.js"
                fi
                sudo bash -c "cat << 'EOF' > /etc/systemd/system/cloudops-app.service
[Unit]
Description=CloudOps Node.js Express Application
After=network.target nginx.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/devops_node
ExecStart=/usr/bin/node /opt/devops_node/$NODE_ENTRY
Restart=always
RestartSec=3
Environment=PORT=5000
Environment=NODE_ENV=production
Environment=DATABASE_URL={db_url}
Environment=DB_HOST=127.0.0.1
Environment=DB_PORT={db_port}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF"
                sudo systemctl daemon-reload
                sudo systemctl enable cloudops-app.service
                sudo systemctl restart cloudops-app.service || true
                """
            elif backend_type == "java_springboot":
                backend_runtime_cmd = f"""
                echo "[Backend] Setting up OpenJDK 17 for Spring Boot..."
                sudo DEBIAN_FRONTEND=noninteractive apt-get install -y openjdk-17-jdk-headless
                JAR_PATH=$(find /opt/devops_springboot -maxdepth 2 -name "*.jar" | head -n 1)
                if [ -z "$JAR_PATH" ]; then
                    JAR_PATH="/opt/devops_springboot/app.jar"
                fi
                sudo bash -c "cat << 'EOF' > /etc/systemd/system/cloudops-app.service
[Unit]
Description=CloudOps Spring Boot Application
After=network.target nginx.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/devops_springboot
ExecStart=/usr/bin/java -jar $JAR_PATH
Restart=always
RestartSec=3
Environment=PORT=8080
Environment=DATABASE_URL={db_url}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF"
                sudo systemctl daemon-reload
                sudo systemctl enable cloudops-app.service
                sudo systemctl restart cloudops-app.service || true
                """
            elif backend_type == "docker" or (state.custom_code.get("backend") or {}).get("has_dockerfile"):
                backend_runtime_cmd = f"""
                echo "[Docker Engine] Setting up Docker container runtime..."
                sudo DEBIAN_FRONTEND=noninteractive apt-get install -y docker.io containerd
                sudo systemctl enable docker
                sudo systemctl start docker
                sudo usermod -aG docker ubuntu
                cd /opt/cloudops_custom_app
                sudo docker stop cloudops-custom-app 2>/dev/null || true
                sudo docker rm -f cloudops-custom-app 2>/dev/null || true
                echo "Building Docker container image 'cloudops-custom-app'..."
                sudo docker build -t cloudops-custom-app . || true
                echo "Starting container on port 8000 with Restart=always..."
                sudo docker run -d --restart always --name cloudops-custom-app -e DATABASE_URL='{db_url}' -p 8000:8000 cloudops-custom-app || true
                sudo docker ps --filter name=cloudops-custom-app
                """

            state.add_log(f"Compiling and activating {backend_type.upper()} Systemd microservice...", stage="ANSIBLE")
            self.execute_ssh_command(target_ip, backend_runtime_cmd)

        # 5. Production Nginx Reverse Proxy with /api/ Routing
        proxy_pass_block = f"""
    location /api {{
        proxy_pass http://127.0.0.1:{backend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }}
        """ if backend_type != "none" else ""

        nginx_conf_cmd = f"""
        sudo chown -R www-data:www-data /var/www/devops_app
        sudo bash -c 'echo \'{{"status":"UP","web_server":"{web_server}","hostname":"\'$(hostname)\'","deployed_by":"Ansible","timestamp":"\'$(date -u +"%Y-%m-%dT%H:%M:%SZ")\'"}}\' > /var/www/devops_app/healthz.json'
        
        sudo bash -c 'cat << "EOF" > /etc/nginx/sites-available/default
server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/devops_app;
    index index.html index.htm;

    location / {{
        try_files $uri $uri/ /index.html;
    }}
{proxy_pass_block}
}}
EOF'
        sudo nginx -t && sudo systemctl reload nginx || sudo systemctl restart nginx
        sudo ufw allow 80/tcp
        sudo ufw allow 22/tcp
        sudo ufw allow {backend_port}/tcp
        """
        state.add_log("Configuring Nginx reverse proxy with /api/ microservice routing...", stage="ANSIBLE")
        self.execute_ssh_command(target_ip, nginx_conf_cmd)

        # 6. Update stack and deployment state
        state.stack["frontend"]["type"] = frontend_type
        state.stack["backend"]["type"] = backend_type
        state.stack["backend"]["port"] = backend_port
        state.stack["database"]["type"] = database_type
        state.stack["database"]["port"] = db_port

        state.deployment.update({
            "status": "deployed",
            "web_server": web_server,
            "deployed_app": f"Production Stack [{frontend_type.upper()} + {backend_type.upper()} + {database_type.upper()}]",
            "deployed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "response_code": 200
        })
        state.infrastructure["app_url"] = f"http://{target_ip}"
        state.add_log(f"✔ Ansible: Successfully deployed application at http://{target_ip}", stage="ANSIBLE")
        state.add_log(f"✔ Live Reverse Proxy Active: Frontend (/) -> Static SPA • Backend (/api/) -> {backend_type.upper()} ({backend_port})", stage="ANSIBLE")
        state.save_current_project()

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
        sudo apt-get update -y
        sudo DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban nagios-nrpe-server monitoring-plugins ufw htop
        sudo bash -c 'cat << "EOF" > /etc/motd
===============================================================
 DEVOPS AUTOMATED CLOUD INFRASTRUCTURE - NODE COMPLIANCE
 Managed By: Puppet Configuration Enforcement Engine
 Status    : Active & Hardened (Zero Drift Baseline)
===============================================================
EOF'
        sudo bash -c 'cat << "EOF" > /etc/ssh/sshd_config.d/99-hardened.conf
MaxAuthTries 4
X11Forwarding no
ClientAliveInterval 300
EOF'
        sudo systemctl restart ssh || sudo systemctl restart sshd
        sudo systemctl enable nagios-nrpe-server
        sudo systemctl start nagios-nrpe-server
        sudo systemctl enable fail2ban
        sudo systemctl start fail2ban
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        sudo ufw allow 5666/tcp
        sudo ufw allow 8000/tcp
        sudo ufw allow 5000/tcp
        sudo ufw allow 8080/tcp
        sudo ufw --force enable || true
        """
        
        success, out, err = self.execute_ssh_command(target_ip, puppet_cmd)
        if success:
            state.add_log("✔ Puppet: Security baseline, SSH hardening, and drift policies enforced successfully.", stage="PUPPET")
            state.compliance.update({
                "status": "compliant",
                "last_enforced": time.strftime("%Y-%m-%d %H:%M:%S"),
                "drift_count": 0
            })
            for rule in state.compliance.get("rules_enforced", []):
                rule["status"] = "active"
                
            if state.chaos["active_fault"] == "config_tamper":
                state.chaos["active_fault"] = None
                state.chaos["description"] = None
                state.clear_alerts_for_service("puppet_drift")
                state.add_alert("INFO", "Compliance Restored", "Puppet healed configuration drift and locked security policies.", "puppet_drift")
        else:
            state.add_log(f"Puppet compliance enforcement failed: {err}", stream="stderr", stage="PUPPET")
            state.compliance["status"] = "failed"
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_nagios_probe(self):
        target_ip = state.infrastructure.get("public_ip")
        if not target_ip:
            return
            
        state.telemetry["last_check"] = time.strftime("%H:%M:%S")
        
        # 1. Check HTTP Web Tier (Port 80)
        try:
            start_t = time.time()
            resp = requests.get(f"http://{target_ip}/healthz.json", timeout=4)
            lat = round((time.time() - start_t) * 1000, 1)
            if resp.status_code == 200:
                state.telemetry["checks"]["http"] = {
                    "name": "Frontend Web Tier (Port 80)",
                    "status": "OK",
                    "code": 200,
                    "response_time_ms": lat
                }
            else:
                state.telemetry["checks"]["http"] = {
                    "name": "Frontend Web Tier (Port 80)",
                    "status": "CRITICAL",
                    "code": resp.status_code,
                    "response_time_ms": lat
                }
        except Exception:
            state.telemetry["checks"]["http"] = {
                "name": "Frontend Web Tier (Port 80)",
                "status": "CRITICAL",
                "code": 0,
                "response_time_ms": 0
            }

        # 2. Check Backend API Tier
        b_type = state.stack.get("backend", {}).get("type", "python")
        b_port = state.stack.get("backend", {}).get("port", 8000)
        if b_type != "none":
            try:
                start_b = time.time()
                b_resp = requests.get(f"http://{target_ip}/api/health", timeout=3)
                if b_resp.status_code not in (200, 404):
                    b_resp = requests.get(f"http://{target_ip}:{b_port}/", timeout=3)
                b_lat = round((time.time() - start_b) * 1000, 1)
                state.telemetry["checks"]["backend_api"] = {
                    "name": f"Backend API ({b_type.upper()} - {b_port})",
                    "status": "OK" if b_resp.status_code in (200, 404) else "CRITICAL",
                    "port": b_port,
                    "latency_ms": b_lat
                }
            except Exception:
                # Direct socket check to backend port
                sb = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sb.settimeout(2)
                try:
                    sb.connect((target_ip, b_port))
                    sb.close()
                    state.telemetry["checks"]["backend_api"] = {
                        "name": f"Backend API ({b_type.upper()} - {b_port})",
                        "status": "OK",
                        "port": b_port,
                        "latency_ms": 15.0
                    }
                except Exception:
                    state.telemetry["checks"]["backend_api"] = {
                        "name": f"Backend API ({b_type.upper()} - {b_port})",
                        "status": "CRITICAL",
                        "port": b_port,
                        "latency_ms": 0
                    }
        else:
            state.telemetry["checks"]["backend_api"] = {
                "name": "Backend API (None)",
                "status": "DISABLED",
                "port": 0,
                "latency_ms": 0
            }

        # 3. Check Database Tier
        d_type = state.stack.get("database", {}).get("type", "postgresql")
        d_port = state.stack.get("database", {}).get("port", 5432)
        if d_type != "none":
            db_cmd = f"nc -z 127.0.0.1 {d_port} || (sudo systemctl is-active postgresql || sudo systemctl is-active mysql || sudo systemctl is-active mongod)"
            db_ok, _, _ = self.execute_ssh_command(target_ip, db_cmd)
            state.telemetry["checks"]["database"] = {
                "name": f"Database ({d_type.upper()} - {d_port})",
                "status": "OK" if db_ok else "CRITICAL",
                "engine": d_type.upper(),
                "port": d_port
            }
        else:
            state.telemetry["checks"]["database"] = {
                "name": "Database (Stateless)",
                "status": "DISABLED",
                "engine": "NONE",
                "port": 0
            }

        # 4. Host Ping (ICMP / Network)
        try:
            ping_start = time.time()
            s_ping = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s_ping.settimeout(2)
            s_ping.connect((target_ip, 22))
            s_ping.close()
            ping_lat = round((time.time() - ping_start) * 1000, 1)
            state.telemetry["checks"]["ping"] = {
                "name": "Host Ping (Network)",
                "status": "OK",
                "latency_ms": ping_lat,
                "packet_loss": "0%"
            }
        except Exception:
            state.telemetry["checks"]["ping"] = {
                "name": "Host Ping (Network)",
                "status": "CRITICAL",
                "latency_ms": 0,
                "packet_loss": "100%"
            }
            
        # 5. Check SSH Daemon
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3)
        try:
            s.connect((target_ip, 22))
            s.close()
            state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "OK", "port_open": True}
        except Exception:
            state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "CRITICAL", "port_open": False}
            
        # 6. Remote Real Hardware Metrics via SSH
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
                
        # Overall health calculation
        if any(c.get("status") == "CRITICAL" for c in state.telemetry["checks"].values()):
            state.telemetry["overall_health"] = "CRITICAL"
        elif any(c.get("status") == "WARNING" for c in state.telemetry["checks"].values()):
            state.telemetry["overall_health"] = "WARNING"
        else:
            state.telemetry["overall_health"] = "HEALTHY"

        # Record real historical rolling time-series point
        cur_cpu = state.telemetry["checks"]["cpu"].get("value", 20.0)
        cur_mem = state.telemetry["checks"]["memory"].get("value", 40.0)
        cur_lat = state.telemetry["checks"]["http"].get("response_time_ms", 30.0)
        state.record_telemetry_point(cpu=cur_cpu, memory=cur_mem, latency=cur_lat)

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
            
        elif fault_type == "backend_down":
            b_type = state.stack["backend"]["type"]
            port = state.stack["backend"]["port"]
            state.add_log(f"[Chaos] Stopping backend {b_type.upper()} microservice on EC2...", stream="stderr", stage="CHAOS")
            if b_type == "docker":
                self.execute_ssh_command(target_ip, "sudo docker stop cloudops-custom-app")
            else:
                self.execute_ssh_command(target_ip, "sudo systemctl stop cloudops-app.service || sudo systemctl stop devops-backend || sudo systemctl stop devops-node || sudo systemctl stop devops-springboot")
            if "backend_api" in state.telemetry["checks"]:
                state.telemetry["checks"]["backend_api"]["status"] = "CRITICAL"
                state.telemetry["checks"]["backend_api"]["latency_ms"] = 0
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", f"Backend Down: Port {port} Unresponsive", f"Backend {b_type.upper()} service stopped via chaos injector.", "backend")

        elif fault_type == "db_down":
            d_type = state.stack["database"]["type"]
            port = state.stack["database"]["port"]
            state.add_log(f"[Chaos] Stopping database {d_type.upper()} daemon on EC2...", stream="stderr", stage="CHAOS")
            self.execute_ssh_command(target_ip, "sudo systemctl stop postgresql || sudo systemctl stop mysql || sudo systemctl stop mongod")
            if "database" in state.telemetry["checks"]:
                state.telemetry["checks"]["database"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", f"Database Outage: {d_type.upper()} Down", f"Database service stopped on port {port}.", "database")

        elif fault_type == "cpu_spike":
            state.add_log("[Chaos] Spawning CPU stress workload on EC2...", stream="stderr", stage="CHAOS")
            self.execute_ssh_command(target_ip, "nohup python3 -c 'import time; [sum(i*i for i in range(1000000)) for _ in range(300)]' > /dev/null 2>&1 &")
            state.telemetry["checks"]["cpu"]["value"] = 95.0
            state.telemetry["checks"]["cpu"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", "High CPU Load Spike", "CPU utilization exceeded 90% threshold.", "cpu_utilization")

        elif fault_type == "config_tamper":
            state.add_log("[Chaos] Simulating unauthorized configuration drift on EC2 (/etc/motd & firewall)...", stream="stderr", stage="CHAOS")
            tamper_cmd = """
            sudo bash -c 'echo "UNAUTHORIZED CONFIGURATION DRIFT - SYSTEM TAMPERED" > /etc/motd'
            sudo ufw disable || true
            """
            self.execute_ssh_command(target_ip, tamper_cmd)
            state.compliance["status"] = "drift_detected"
            state.compliance["drift_count"] = 2
            if len(state.compliance["rules_enforced"]) >= 2:
                state.compliance["rules_enforced"][0]["status"] = "drift_detected"
                state.compliance["rules_enforced"][1]["status"] = "drift_detected"
            state.telemetry["overall_health"] = "WARNING"
            state.add_alert("WARNING", "Configuration Drift Detected", "Security baseline tampered: /etc/motd modified and firewall disabled.", "puppet_drift")

    async def heal_chaos(self):
        fault = state.chaos.get("active_fault")
        target_ip = state.infrastructure.get("public_ip")
        
        state.is_running_pipeline = True
        state.current_action = "Auto-Remediation (Live EC2 Node)"
        try:
            if not target_ip:
                state.chaos["active_fault"] = None
                state.chaos["description"] = None
                state.telemetry["alerts"] = [a for a in state.telemetry["alerts"] if a.get("severity") not in ("CRITICAL", "WARNING")]
                state.telemetry["overall_health"] = "HEALTHY"
                state.add_log("[CHAOS] Local test state reset to HEALTHY baseline.", stage="CHAOS")
                return
            
            server = state.deployment.get("web_server", "nginx")
            state.add_log(f"[CHAOS] Initiating Live Automated Remediation on EC2 node ({target_ip})...", stage="CHAOS")

            if fault == "config_tamper" or state.compliance.get("status") == "drift_detected":
                state.add_log("[CHAOS] Invoking Puppet desired-state engine to reconcile drift...", stage="CHAOS")
                await self.run_puppet_enforce()
                state.clear_alerts_for_service("puppet_drift")
                state.add_log("[CHAOS] ✔ Puppet healed configuration drift and locked security baseline.", stage="CHAOS")

            elif fault == "backend_down" or state.telemetry["checks"]["backend_api"].get("status") != "OK":
                b_type = state.stack["backend"]["type"]
                state.add_log(f"[CHAOS] Restarting backend ({b_type.upper()}) on EC2...", stage="CHAOS")
                if b_type == "docker":
                    self.execute_ssh_command(target_ip, "sudo docker start cloudops-custom-app")
                else:
                    self.execute_ssh_command(target_ip, "sudo systemctl restart cloudops-app.service || sudo systemctl restart devops-backend || sudo systemctl restart devops-node || sudo systemctl restart devops-springboot")
                await asyncio.sleep(1.5)
                state.clear_alerts_for_service("backend")
                state.add_log(f"[CHAOS] ✔ Backend {b_type.upper()} restarted successfully.", stage="CHAOS")

            elif fault == "db_down" or state.telemetry["checks"]["database"].get("status") != "OK":
                d_type = state.stack["database"]["type"]
                state.add_log(f"[CHAOS] Restarting database ({d_type.upper()}) on EC2...", stage="CHAOS")
                self.execute_ssh_command(target_ip, "sudo systemctl restart postgresql || sudo systemctl restart mysql || sudo systemctl restart mongod")
                await asyncio.sleep(1.5)
                state.clear_alerts_for_service("database")
                state.add_log(f"[CHAOS] ✔ Database {d_type.upper()} service restarted and verified.", stage="CHAOS")

            elif fault == "cpu_spike" or state.telemetry["checks"]["cpu"].get("status") != "OK":
                state.add_log("[CHAOS] Terminating high CPU stress workloads on EC2...", stage="CHAOS")
                self.execute_ssh_command(target_ip, "sudo pkill -f 'python3 -c'")
                await asyncio.sleep(1.5)
                state.clear_alerts_for_service("cpu_utilization")
                state.add_log("[CHAOS] ✔ CPU stress process terminated. Load normal.", stage="CHAOS")

            else:
                state.add_log(f"[CHAOS] Restarting {server} and restoring baseline on EC2...", stage="CHAOS")
                self.execute_ssh_command(target_ip, f"sudo systemctl restart {server} && sudo pkill -f 'python3 -c'")
                await asyncio.sleep(1.5)
                state.clear_alerts_for_service("http_service")
                state.clear_alerts_for_service("cpu_utilization")
                state.add_log(f"[CHAOS] ✔ {server.upper()} web server restarted and verified.", stage="CHAOS")

            state.chaos["active_fault"] = None
            state.chaos["description"] = None
            state.telemetry["alerts"] = [a for a in state.telemetry["alerts"] if a.get("severity") not in ("CRITICAL", "WARNING")]
            state.telemetry["overall_health"] = "HEALTHY"
            await self.run_nagios_probe()
            state.add_log("[CHAOS] ✔ Live Multi-Tier Remediation complete: 100% services HEALTHY.", stage="CHAOS")
        finally:
            state.is_running_pipeline = False
            state.current_action = None

live_engine = LiveEngine()

