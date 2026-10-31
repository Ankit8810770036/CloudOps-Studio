import asyncio
import time
import random
from state import state

class SimulationEngine:
    async def run_terraform_apply(self, region: str = "us-east-1", instance_type: str = "t2.micro"):
        state.is_running_pipeline = True
        state.current_action = "Terraform Provisioning"
        state.infrastructure["status"] = "provisioning"
        
        logs = [
            ("Initializing Terraform provider plugins...", 0.6),
            ("- Finding hashicorp/aws versions matching '~> 5.0'...", 0.8),
            ("- Finding hashicorp/tls versions matching '~> 4.0'...", 0.5),
            ("- Finding hashicorp/local versions matching '~> 2.4'...", 0.5),
            ("- Installing hashicorp/aws v5.42.0...", 1.2),
            ("- Installing hashicorp/tls v4.0.5...", 0.6),
            ("- Installing hashicorp/local v2.5.1...", 0.5),
            ("Terraform has been successfully initialized!", 0.7),
            ("", 0.2),
            (f"Terraform will perform the following actions in region [{region}]:", 0.6),
            ("  + aws_security_group.devops_sg (Ports 22, 80, 443, 5000, 8000, 8080, 5432, 5666)", 0.5),
            ("      description: \"Allow Multi-Tier Web, Backend API, Database & Nagios Traffic\"", 0.4),
            (f"      vpc_id:      \"vpc-0a817f9b42c13d80a\" (Default VPC)", 0.4),
            ("  + tls_private_key.devops_key (RSA 4096-bit)", 0.5),
            ("  + aws_key_pair.generated_key", 0.4),
            (f"  + aws_instance.web_server ({instance_type}, Ubuntu 22.04 LTS)", 0.6),
            ("      ami:                         \"ami-0c7217cdde317cfec\"", 0.4),
            ("      associate_public_ip_address: true", 0.3),
            ("      root_block_device:           20 GB gp3", 0.4),
            ("", 0.4),
            ("Plan: 4 to add, 0 to change, 0 to destroy.", 0.8),
            ("tls_private_key.devops_key: Creating...", 0.9),
            ("tls_private_key.devops_key: Creation complete after 1s", 0.6),
            ("aws_key_pair.generated_key: Creating...", 0.7),
            ("aws_key_pair.generated_key: Creation complete after 1s", 0.6),
            ("aws_security_group.devops_sg: Creating...", 1.2),
            ("aws_security_group.devops_sg: Creation complete after 2s [id=sg-07b9a4c09d4128f11]", 0.8),
            ("aws_instance.web_server: Creating...", 1.2),
            ("aws_instance.web_server: Still creating... [10s elapsed]", 1.5),
            ("aws_instance.web_server: Still creating... [20s elapsed]", 1.5),
            ("aws_instance.web_server: Creation complete after 24s [id=i-094b81c29e710dfa4]", 1.0),
            ("", 0.3),
            ("Apply complete! Resources: 4 added, 0 changed, 0 destroyed.", 0.6),
            ("Outputs:", 0.3),
            ("  instance_id       = \"i-094b81c29e710dfa4\"", 0.3),
            ("  public_ip         = \"54.210.88.142\"", 0.3),
            ("  public_dns        = \"ec2-54-210-88-142.compute-1.amazonaws.com\"", 0.3),
            ("  security_group_id = \"sg-07b9a4c09d4128f11\"", 0.3),
            ("  app_url           = \"http://54.210.88.142\"", 0.3),
            ("  ssh_command       = \"ssh -i terraform/devops-key.pem ubuntu@54.210.88.142\"", 0.4)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="TERRAFORM")
            await asyncio.sleep(delay * 0.35)
            
        state.infrastructure.update({
            "status": "ready",
            "instance_id": "i-094b81c29e710dfa4",
            "public_ip": "54.210.88.142",
            "public_dns": "ec2-54-210-88-142.compute-1.amazonaws.com",
            "security_group": "sg-07b9a4c09d4128f11",
            "vpc_id": "vpc-0a817f9b42c13d80a",
            "app_url": "http://54.210.88.142",
            "ssh_command": "ssh -i terraform/devops-key.pem ubuntu@54.210.88.142",
            "provisioned_at": time.strftime("%Y-%m-%d %H:%M:%S")
        })
        
        state.telemetry["checks"]["ping"] = {"name": "Host Ping (ICMP)", "status": "OK", "latency_ms": 24.2, "packet_loss": "0%"}
        state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "OK", "port_open": True}
        state.telemetry["overall_health"] = "WARNING"
        
        state.is_running_pipeline = False
        state.current_action = None

    async def run_terraform_destroy(self):
        state.is_running_pipeline = True
        state.current_action = "Terraform Destroy"
        state.infrastructure["status"] = "destroying"
        
        logs = [
            ("Initializing Terraform Cloud Teardown...", 0.6),
            ("aws_instance.web_server: Destroying... [id=i-094b81c29e710dfa4]", 1.0),
            ("aws_instance.web_server: Destruction complete after 14s", 0.8),
            ("aws_security_group.devops_sg: Destruction complete after 2s", 0.6),
            ("aws_key_pair.generated_key: Destruction complete after 1s", 0.5),
            ("tls_private_key.devops_key: Destruction complete after 0s", 0.4),
            ("Destroy complete! Resources: 4 destroyed.", 0.6)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="TERRAFORM")
            await asyncio.sleep(delay * 0.25)
            
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
        state.telemetry["overall_health"] = "UNKNOWN"
        for k in state.telemetry["checks"]:
            state.telemetry["checks"][k]["status"] = "UNKNOWN"
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_ansible_deploy(self, web_server: str = "nginx", frontend_type: str = "react", backend_type: str = "python", database_type: str = "postgresql"):
        state.is_running_pipeline = True
        state.current_action = f"Ansible Full-Stack Deployment [{frontend_type.upper()} + {backend_type.upper()} + {database_type.upper()}]"
        state.deployment["status"] = "deploying"
        state.deployment["web_server"] = web_server
        
        # Update stack configuration in state
        state.stack["frontend"]["type"] = frontend_type
        state.stack["backend"]["type"] = backend_type
        state.stack["database"]["type"] = database_type
        
        b_port = 8080 if backend_type == 'java_springboot' else 5000 if backend_type == 'nodejs' else 8000
        state.stack["backend"]["port"] = b_port
        
        db_port = 5432 if database_type == 'postgresql' else 3306 if database_type == 'mysql' else 27017 if database_type == 'mongodb' else 0
        state.stack["database"]["port"] = db_port
        
        target_ip = state.infrastructure["public_ip"] or "54.210.88.142"
        
        logs = [
            (f"Generating dynamic inventory for host [{target_ip}]...", 0.5),
            (f"Executing: ansible-playbook -i inventory.ini site.yml -e frontend_type={frontend_type} backend_type={backend_type} database_type={database_type}", 0.7),
            ("", 0.2),
            ("PLAY [Configure Cloud Server and Deploy Full-Stack Polyglot Application] ****", 0.6),
            (f"TASK [Gathering Facts] ********************************************************", 0.6),
            (f"ok: [{target_ip}]", 0.4),
            (f"TASK [Update apt repository cache] *******************************************", 0.8),
            (f"changed: [{target_ip}]", 0.5),
            ("", 0.2)
        ]
        
        # 1. Database Tier Task Simulation
        if database_type == 'postgresql':
            logs.extend([
                ("TASK [database_postgresql : Install PostgreSQL 15 & contrib] *****************", 1.0),
                (f"changed: [{target_ip}] => (packages=postgresql, postgresql-contrib, python3-psycopg2)", 0.6),
                ("TASK [database_postgresql : Ensure PostgreSQL service is active] *************", 0.7),
                (f"changed: [{target_ip}] => state=started port=5432", 0.5),
                ("TASK [database_postgresql : Create Application Database & User] **************", 0.8),
                (f"changed: [{target_ip}] => db=devops_db user=app_user", 0.5),
                ("TASK [database_postgresql : Verify PostgreSQL socket] *************************", 0.6),
                (f"ok: [{target_ip}] => pg_isready: 127.0.0.1:5432 - accepting connections", 0.5),
                ("", 0.2)
            ])
        elif database_type == 'mysql':
            logs.extend([
                ("TASK [database_mysql : Install MariaDB/MySQL Server] *************************", 1.0),
                (f"changed: [{target_ip}] => (packages=mariadb-server, python3-pymysql)", 0.6),
                ("TASK [database_mysql : Initialize Schema & Users] *****************************", 0.8),
                (f"changed: [{target_ip}] => db=devops_db (Port 3306)", 0.5),
                ("", 0.2)
            ])

        # 2. Backend Tier Task Simulation
        has_custom_b = bool(state.custom_code.get("backend"))
        b_files = (state.custom_code.get("backend") or {}).get("files", [])

        if backend_type == 'java_springboot':
            logs.extend([
                ("TASK [backend_java : Install OpenJDK 17 Runtime & Maven Build Tools] *********", 1.2),
                (f"changed: [{target_ip}] => openjdk-17-jdk-headless & maven", 0.7),
            ])
            if has_custom_b and any(f.lower().endswith(".jar") for f in b_files):
                logs.extend([
                    ("TASK [backend_java : Deploy Standalone Executable Spring Boot JAR] ***********", 1.0),
                    (f"changed: [{target_ip}] => /opt/devops_springboot/app.jar (All libraries embedded in BOOT-INF/lib)", 0.8),
                ])
            else:
                logs.extend([
                    ("TASK [backend_java : Deploy Spring Boot Application Code & Properties] *******", 0.9),
                    (f"changed: [{target_ip}] => dest=/opt/devops_springboot/application.properties", 0.6),
                    ("TASK [backend_java : Compile Java Source & Configure Systemd Unit] ***********", 1.2),
                    (f"changed: [{target_ip}] => /etc/systemd/system/devops-springboot.service", 0.7),
                ])
            logs.extend([
                ("TASK [backend_java : Start Spring Boot Daemon & Wait for Health Endpoint] ***", 1.4),
                (f"ok: [{target_ip}] => HTTP 200 on http://127.0.0.1:8080/api/health", 0.6),
                ("", 0.2)
            ])
        elif backend_type == 'python':
            logs.extend([
                ("TASK [backend_python : Create Python venv & Core Virtual Environment] *********", 1.1),
                (f"changed: [{target_ip}] => /opt/devops_backend/venv (Python 3.10+)", 0.7),
            ])
            if has_custom_b and any("requirements.txt" in f.lower() for f in b_files):
                logs.extend([
                    ("TASK [backend_python : Detect requirements.txt & Install Project Libraries] ***", 1.2),
                    (f"changed: [{target_ip}] => pip install -r requirements.txt (Dependencies successfully resolved)", 1.0),
                ])
            else:
                logs.extend([
                    ("TASK [backend_python : Install Default FastAPI & Microservice Dependencies] ***", 0.9),
                    (f"changed: [{target_ip}] => (fastapi, uvicorn, pydantic, psycopg2)", 0.6),
                ])
            logs.extend([
                ("TASK [backend_python : Deploy API Application Code & Systemd Unit] ***********", 0.9),
                (f"changed: [{target_ip}] => /etc/systemd/system/devops-backend.service", 0.6),
                ("TASK [backend_python : Start FastAPI Daemon & Verify /api/health] *************", 1.0),
                (f"ok: [{target_ip}] => HTTP 200 on http://127.0.0.1:8000/api/health", 0.5),
                ("", 0.2)
            ])
        elif backend_type == 'nodejs':
            logs.extend([
                ("TASK [backend_nodejs : Install Node.js v20 LTS & npm Package Manager] *********", 1.0),
                (f"changed: [{target_ip}] => /usr/bin/node v20.12.0 & npm v10.5.0", 0.6),
            ])
            if has_custom_b and any("package.json" in f.lower() for f in b_files):
                logs.extend([
                    ("TASK [backend_nodejs : Detect package.json & Install Project Dependencies] ****", 1.2),
                    (f"changed: [{target_ip}] => npm install --production (node_modules populated)", 1.0),
                ])
            else:
                logs.extend([
                    ("TASK [backend_nodejs : Install Default Express & REST API Dependencies] *******", 0.9),
                    (f"changed: [{target_ip}] => (express, cors, dotenv)", 0.6),
                ])
            logs.extend([
                ("TASK [backend_nodejs : Deploy Express Application & Systemd Unit] *************", 0.9),
                (f"changed: [{target_ip}] => /etc/systemd/system/devops-node.service (Port 5000)", 0.6),
                ("TASK [backend_nodejs : Start Node Daemon & Verify /api/health] ****************", 1.0),
                (f"ok: [{target_ip}] => HTTP 200 on http://127.0.0.1:5000/api/health", 0.5),
                ("", 0.2)
            ])
        elif backend_type == 'docker' or (has_custom_b and (state.custom_code.get("backend") or {}).get("has_dockerfile")):
            logs.extend([
                ("TASK [backend_docker : Auto-Detect Dockerfile & Install Container Runtime] ****", 1.2),
                (f"changed: [{target_ip}] => packages=(docker.io, containerd, runc)", 0.7),
                ("TASK [backend_docker : Transfer Project Source & Dockerfile to /opt/cloudops_custom_app] *", 0.9),
                (f"changed: [{target_ip}] => dest=/opt/cloudops_custom_app (Dockerfile detected)", 0.6),
                ("TASK [backend_docker : Build Multi-Stage Docker Image (docker build)] *********", 1.4),
                (f"changed: [{target_ip}] => docker build -t cloudops-custom-app . (Universal Polyglot Container)", 0.8),
                ("TASK [backend_docker : Launch Supervised Container with Restart=always] ********", 1.1),
                (f"changed: [{target_ip}] => docker run -d --restart always --name cloudops-custom-app -p 8000:8000 cloudops-custom-app", 0.8),
                ("TASK [backend_docker : Verify Container Health on Port 8000] ******************", 1.0),
                (f"ok: [{target_ip}] => Container cloudops-custom-app is RUNNING (Port 0.0.0.0:8000->8000/tcp)", 0.5),
                ("", 0.2)
            ])

        # 3. Frontend & Reverse Proxy Task Simulation
        logs.extend([
            (f"TASK [{web_server.capitalize()} : Install {web_server.upper()} Web Server & Reverse Proxy] *", 1.0),
            (f"changed: [{target_ip}]", 0.6),
            (f"TASK [nginx_reverse_proxy : Configure ProxyPass /api/ -> 127.0.0.1:{b_port}] ***", 0.9),
            (f"changed: [{target_ip}] => /etc/nginx/sites-available/devops_app", 0.6),
            (f"TASK [webapp : Deploy {frontend_type.upper()} Static Assets to /var/www/devops_app] ****", 1.0),
            (f"changed: [{target_ip}] => (index.html, style.css, app.js)", 0.6),
            ("TASK [Verify End-to-End HTTP 200 on Port 80] **********************************", 1.0),
            (f"ok: [{target_ip}] => status=200 response='HTTP/1.1 200 OK'", 0.6),
            ("", 0.2),
            ("PLAY RECAP ********************************************************************", 0.5),
            (f"{target_ip}              : ok=14   changed=10   unreachable=0    failed=0", 0.6),
            ("", 0.2),
            (f"✔ Full-Stack Success! [{frontend_type.upper()} Frontend | {backend_type.upper()} Backend | {database_type.upper()} DB] active at http://{target_ip}", 0.5)
        ])
        
        for text, delay in logs:
            state.add_log(text, stage="ANSIBLE")
            await asyncio.sleep(delay * 0.3)
            
        state.deployment.update({
            "status": "deployed",
            "web_server": web_server,
            "deployed_app": f"Full-Stack [{frontend_type.upper()} + {backend_type.upper()} + {database_type.upper()}]",
            "deployed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "response_code": 200
        })
        
        # Telemetry updates for all 3 tiers
        state.telemetry["checks"]["http"] = {
            "name": "Frontend Web Tier (Port 80)",
            "status": "OK",
            "code": 200,
            "response_time_ms": 32.5
        }
        state.telemetry["checks"]["backend_api"] = {
            "name": f"Backend API ({backend_type.upper()})",
            "status": "OK" if backend_type != 'none' else 'DISABLED',
            "port": b_port,
            "latency_ms": 18.2
        }
        state.telemetry["checks"]["database"] = {
            "name": f"Database ({database_type.upper()})",
            "status": "OK" if database_type != 'none' else 'DISABLED',
            "engine": database_type.upper(),
            "port": db_port
        }
        state.telemetry["checks"]["cpu"] = {"name": "CPU Utilization", "status": "OK", "value": 22.4, "unit": "%"}
        state.telemetry["checks"]["memory"] = {"name": "RAM Utilization", "status": "OK", "value": 41.5, "unit": "%"}
        state.telemetry["checks"]["disk"] = {"name": "Disk Usage (/)", "status": "OK", "value": 24.0, "unit": "%"}
        state.telemetry["overall_health"] = "HEALTHY"
        
        state.is_running_pipeline = False
        state.current_action = None

    async def run_puppet_enforce(self):
        state.is_running_pipeline = True
        state.current_action = "Puppet Multi-Tier Compliance"
        state.compliance["status"] = "enforcing"
        
        logs = [
            ("Executing: puppet apply /etc/puppetlabs/code/environments/production/manifests/site.pp", 0.6),
            ("Notice: Compiled catalog for devops-cloud-node in environment production in 0.44 seconds", 0.9),
            ("Notice: /Stage[main]/Main/Package[nagios-nrpe-server]/ensure: ensure changed 'purged' to 'present'", 0.8),
            ("Notice: /Stage[main]/Main/File[/etc/motd]/content: content changed '{md5}a4b79' to '{md5}8f1c3'", 0.7),
            ("Notice: /Stage[main]/Main/File[/etc/ssh/sshd_config.d/99-hardened.conf]/ensure: created", 0.7),
            ("Notice: /Stage[main]/Main/Service[ssh]: Triggered 'refresh' from 1 event", 0.5),
            ("Notice: /Stage[main]/Main/Exec[enforce_database_security_isolation]/returns: 127.0.0.1 bound", 0.8),
            ("Notice: /Stage[main]/Main/Service[backend_supervisor]: active & enabled", 0.6),
            ("Notice: Applied catalog in 1.42 seconds", 0.6),
            ("✔ Multi-Tier Compliance Complete: Frontend, Backend, and Database match desired state. 0 drifts.", 0.5)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="PUPPET")
            await asyncio.sleep(delay * 0.3)
            
        state.compliance.update({
            "status": "compliant",
            "last_enforced": time.strftime("%Y-%m-%d %H:%M:%S"),
            "drift_count": 0
        })
        
        if state.chaos["active_fault"] == "config_tamper":
            state.chaos["active_fault"] = None
            state.chaos["description"] = None
            state.clear_alerts_for_service("puppet_drift")
            state.add_alert("INFO", "Configuration Remediated", "Puppet restored /etc/motd and security policies.", "puppet_drift")
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_nagios_probe(self):
        state.telemetry["last_check"] = time.strftime("%H:%M:%S")
        
        # Check active fault
        fault = state.chaos["active_fault"]
        if fault == "http_down":
            state.telemetry["checks"]["http"]["status"] = "CRITICAL"
            state.telemetry["checks"]["http"]["code"] = 502
            state.telemetry["overall_health"] = "CRITICAL"
            return
            
        if fault == "backend_down":
            state.telemetry["checks"]["backend_api"]["status"] = "CRITICAL"
            state.telemetry["checks"]["backend_api"]["latency_ms"] = 0
            state.telemetry["overall_health"] = "CRITICAL"
            return

        if fault == "db_down":
            state.telemetry["checks"]["database"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            return
            
        if fault == "cpu_spike":
            state.telemetry["checks"]["cpu"]["status"] = "CRITICAL"
            state.telemetry["checks"]["cpu"]["value"] = 96.8
            state.telemetry["overall_health"] = "CRITICAL"
            return
            
        # Normal healthy fluctuation
        if state.deployment["status"] == "deployed":
            b_type = state.stack["backend"]["type"]
            d_type = state.stack["database"]["type"]
            
            cpu_val = round(random.uniform(16.0, 28.0), 1)
            mem_val = round(random.uniform(38.0, 44.0), 1)
            lat = round(random.uniform(24.0, 42.0), 1)
            b_lat = round(random.uniform(12.0, 24.0), 1)
            
            state.telemetry["checks"]["ping"]["latency_ms"] = round(random.uniform(20.0, 28.0), 1)
            state.telemetry["checks"]["http"] = {
                "name": "Frontend Web Tier (Port 80)",
                "status": "OK",
                "code": 200,
                "response_time_ms": lat
            }
            if b_type != 'none':
                state.telemetry["checks"]["backend_api"] = {
                    "name": f"Backend API ({b_type.upper()})",
                    "status": "OK",
                    "port": state.stack["backend"]["port"],
                    "latency_ms": b_lat
                }
            if d_type != 'none':
                state.telemetry["checks"]["database"] = {
                    "name": f"Database ({d_type.upper()})",
                    "status": "OK",
                    "engine": d_type.upper(),
                    "port": state.stack["database"]["port"]
                }
            state.telemetry["checks"]["cpu"]["value"] = cpu_val
            state.telemetry["checks"]["cpu"]["status"] = "OK"
            state.telemetry["checks"]["memory"]["value"] = mem_val
            state.telemetry["checks"]["memory"]["status"] = "OK"
            state.telemetry["checks"]["disk"]["value"] = 24.0
            state.telemetry["checks"]["disk"]["status"] = "OK"
            state.telemetry["overall_health"] = "HEALTHY"

        # Record real historical rolling time-series point
        cur_cpu = state.telemetry["checks"]["cpu"].get("value", 20.0)
        cur_mem = state.telemetry["checks"]["memory"].get("value", 40.0)
        cur_lat = state.telemetry["checks"]["http"].get("response_time_ms", 30.0)
        state.record_telemetry_point(cpu=cur_cpu, memory=cur_mem, latency=cur_lat)

    async def inject_chaos(self, fault_type: str):
        state.chaos["active_fault"] = fault_type
        state.chaos["injected_at"] = time.strftime("%H:%M:%S")
        
        if fault_type == "http_down":
            state.chaos["description"] = "Frontend Web Server Crash (systemctl stop nginx)"
            state.telemetry["checks"]["http"]["status"] = "CRITICAL"
            state.telemetry["checks"]["http"]["code"] = 502
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", "Frontend Down: Port 80 Connection Refused", "Nginx web server is inactive.", "frontend")
            state.add_log("[CRITICAL ALERT] Nagios: Frontend HTTP port 80 failed!", stream="stderr", stage="NAGIOS")
            
        elif fault_type == "backend_down":
            b_type = state.stack["backend"]["type"].upper()
            port = state.stack["backend"]["port"]
            if state.stack["backend"]["type"] == "docker":
                state.chaos["description"] = "Backend Container Outage (docker stop cloudops-custom-app)"
            else:
                state.chaos["description"] = f"Backend Microservice Crash (systemctl stop devops-{state.stack['backend']['type']})"
            state.telemetry["checks"]["backend_api"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", f"Backend Down: {b_type} API Unreachable", f"Port {port} connection refused on backend service.", "backend")
            state.add_log(f"[CRITICAL ALERT] Nagios: Backend API on port {port} unresponsive!", stream="stderr", stage="NAGIOS")

        elif fault_type == "db_down":
            d_type = state.stack["database"]["type"].upper()
            port = state.stack["database"]["port"]
            state.chaos["description"] = f"Database Service Crash (systemctl stop {state.stack['database']['type']})"
            state.telemetry["checks"]["database"]["status"] = "CRITICAL"
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", f"Database Outage: {d_type} (Port {port}) Down", "Backend reports database connection timeout.", "database")
            state.add_log(f"[CRITICAL ALERT] Nagios: Database check failed on port {port}!", stream="stderr", stage="NAGIOS")

        elif fault_type == "cpu_spike":
            state.chaos["description"] = "High CPU Stress Injection (stress-ng --cpu 4)"
            state.telemetry["checks"]["cpu"]["status"] = "CRITICAL"
            state.telemetry["checks"]["cpu"]["value"] = 96.8
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert("CRITICAL", "High CPU Load: 96.8%", "NRPE check_load reported threshold violation (>90%).", "cpu")
            state.add_log("[CRITICAL ALERT] Nagios: CPU Load 96.8% exceeds threshold 90%", stream="stderr", stage="NAGIOS")
            
        elif fault_type == "config_tamper":
            state.chaos["description"] = "Unauthorized Configuration Drift (/etc/motd & SSH tampered)"
            state.compliance["status"] = "drift_detected"
            state.compliance["drift_count"] = 2
            state.telemetry["overall_health"] = "WARNING"
            state.add_alert("WARNING", "Configuration Drift Detected", "System security baseline diverged from Puppet manifest.", "puppet_drift")

    async def heal_chaos(self):
        fault = state.chaos["active_fault"]
        if not fault:
            return
            
        state.add_log(f"Initiating Automated Multi-Tier Remediation for fault [{fault}]...", stage="SYSTEM")
        await asyncio.sleep(0.8)
        
        if fault == "http_down":
            server = state.deployment["web_server"]
            state.add_log(f"Ansible Handler: Restarting {server} web daemon...", stage="ANSIBLE")
            await asyncio.sleep(1.0)
            state.clear_alerts_for_service("frontend")
            state.add_alert("INFO", "Frontend Restored", f"{server.upper()} restarted and verified.", "frontend")
            
        elif fault == "backend_down":
            b_type = state.stack["backend"]["type"]
            if b_type == "docker":
                state.add_log("Docker Supervisor: Restarting container (docker start cloudops-custom-app)...", stage="SYSTEM")
            else:
                state.add_log(f"Puppet Supervisor: Reviving {b_type.upper()} backend service...", stage="PUPPET")
            await asyncio.sleep(1.0)
            state.clear_alerts_for_service("backend")
            state.add_alert("INFO", "Backend Restored", f"{b_type.upper()} service restarted and responsive on port {state.stack['backend']['port']}.", "backend")

        elif fault == "db_down":
            d_type = state.stack["database"]["type"]
            state.add_log(f"Puppet Daemon Manager: Restarting {d_type.upper()} database service...", stage="PUPPET")
            await asyncio.sleep(1.0)
            state.clear_alerts_for_service("database")
            state.add_alert("INFO", "Database Restored", f"{d_type.upper()} accepting connections on port {state.stack['database']['port']}.", "database")

        elif fault == "cpu_spike":
            state.add_log("Terminating stress workloads...", stage="SYSTEM")
            await asyncio.sleep(1.0)
            state.clear_alerts_for_service("cpu")
            state.add_alert("INFO", "CPU Normal", "Load returned to normal operating range.", "cpu")
            
        elif fault == "config_tamper":
            await self.run_puppet_enforce()
            
        state.chaos["active_fault"] = None
        state.chaos["description"] = None
        state.telemetry["overall_health"] = "HEALTHY"
        await self.run_nagios_probe()

simulator = SimulationEngine()
