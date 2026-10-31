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
            ("Initializing Terraform the provider plugins...", 0.6),
            ("- Finding hashicorp/aws versions matching '~> 5.0'...", 0.8),
            ("- Finding hashicorp/tls versions matching '~> 4.0'...", 0.5),
            ("- Finding hashicorp/local versions matching '~> 2.4'...", 0.5),
            ("- Installing hashicorp/aws v5.42.0...", 1.2),
            ("- Installing hashicorp/tls v4.0.5...", 0.6),
            ("- Installing hashicorp/local v2.5.1...", 0.5),
            ("Terraform has been successfully initialized!", 0.7),
            ("", 0.2),
            (f"Terraform will perform the following actions in region [{region}]:", 0.6),
            ("  + aws_security_group.devops_sg", 0.5),
            ("      description: \"Allow SSH (22), HTTP (80), HTTPS (443), and Nagios NRPE (5666)\"", 0.4),
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
            await asyncio.sleep(delay * 0.4) # Slightly faster for snappy UI experience
            
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
        
        # Initial health status for target node
        state.telemetry["checks"]["ping"] = {"name": "Host Ping (ICMP)", "status": "OK", "latency_ms": 24.2, "packet_loss": "0%"}
        state.telemetry["checks"]["ssh"] = {"name": "SSH Daemon (Port 22)", "status": "OK", "port_open": True}
        state.telemetry["overall_health"] = "WARNING" # Web app not deployed yet
        
        state.is_running_pipeline = False
        state.current_action = None

    async def run_terraform_destroy(self):
        state.is_running_pipeline = True
        state.current_action = "Terraform Destroy"
        state.infrastructure["status"] = "destroying"
        
        logs = [
            ("Initializing Terraform Cloud Teardown...", 0.6),
            ("aws_instance.web_server: Destroying... [id=i-094b81c29e710dfa4]", 1.0),
            ("aws_instance.web_server: Still destroying... [10s elapsed]", 1.2),
            ("aws_instance.web_server: Destruction complete after 14s", 0.8),
            ("aws_security_group.devops_sg: Destroying... [id=sg-07b9a4c09d4128f11]", 0.8),
            ("aws_security_group.devops_sg: Destruction complete after 2s", 0.6),
            ("aws_key_pair.generated_key: Destruction complete after 1s", 0.5),
            ("tls_private_key.devops_key: Destruction complete after 0s", 0.4),
            ("Destroy complete! Resources: 4 destroyed.", 0.6)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="TERRAFORM")
            await asyncio.sleep(delay * 0.3)
            
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

    async def run_ansible_deploy(self, web_server: str = "nginx"):
        state.is_running_pipeline = True
        state.current_action = f"Ansible Deployment ({web_server.upper()})"
        state.deployment["status"] = "deploying"
        state.deployment["web_server"] = web_server
        
        target_ip = state.infrastructure["public_ip"] or "54.210.88.142"
        
        logs = [
            (f"Generating dynamic inventory for host [{target_ip}]...", 0.5),
            (f"Executing: ansible-playbook -i inventory.ini site.yml -e web_server_type={web_server}", 0.7),
            ("", 0.2),
            ("PLAY [Configure Cloud Server and Deploy Application] *************************", 0.6),
            ("", 0.2),
            ("TASK [Gathering Facts] ********************************************************", 0.8),
            (f"ok: [{target_ip}]", 0.6),
            ("", 0.2),
            ("TASK [Update apt repository cache] *******************************************", 1.0),
            (f"changed: [{target_ip}]", 0.8),
            ("", 0.2),
            ("TASK [Install baseline system dependencies] **********************************", 1.1),
            (f"ok: [{target_ip}] => (item=curl, wget, ufw, htop, git, net-tools)", 0.8),
            ("", 0.2),
            (f"TASK [{web_server.capitalize()} : Install {web_server.upper()} Web Server] *****************************", 1.2),
            (f"changed: [{target_ip}]", 0.8),
            ("", 0.2),
            (f"TASK [{web_server.capitalize()} : Configure {web_server.upper()} Virtual Host] **************************", 0.9),
            (f"changed: [{target_ip}] => dest=/etc/{web_server}/sites-available/devops_app", 0.7),
            ("", 0.2),
            ("TASK [webapp : Deploy Web Application Static Assets] **************************", 1.0),
            (f"changed: [{target_ip}] => (app/index.html, app/style.css, app/app.js)", 0.8),
            ("", 0.2),
            ("TASK [webapp : Generate Dynamic Host Metadata JSON] ***************************", 0.7),
            (f"changed: [{target_ip}] => /var/www/devops_app/healthz.json", 0.6),
            ("", 0.2),
            ("TASK [Ensure UFW firewall allows HTTP traffic (Port 80)] *********************", 0.6),
            (f"ok: [{target_ip}]", 0.5),
            ("", 0.2),
            ("TASK [Verify Web Service is running and responding (HTTP 200)] ****************", 1.2),
            (f"ok: [{target_ip}] => status=200 response='HTTP/1.1 200 OK'", 0.8),
            ("", 0.3),
            ("PLAY RECAP ********************************************************************", 0.5),
            (f"{target_ip}              : ok=9    changed=6    unreachable=0    failed=0", 0.6),
            ("", 0.3),
            (f"✔ Success! {web_server.upper()} web server and application deployed at http://{target_ip}", 0.5)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="ANSIBLE")
            await asyncio.sleep(delay * 0.35)
            
        state.deployment.update({
            "status": "deployed",
            "web_server": web_server,
            "deployed_app": "CloudOps Operations Portal v1.0",
            "deployed_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "response_code": 200
        })
        
        # Telemetry updates
        state.telemetry["checks"]["http"] = {
            "name": "HTTP Service (Port 80)",
            "status": "OK",
            "code": 200,
            "response_time_ms": 38.4
        }
        state.telemetry["checks"]["cpu"] = {"name": "CPU Utilization", "status": "OK", "value": 18.5, "unit": "%"}
        state.telemetry["checks"]["memory"] = {"name": "RAM Utilization", "status": "OK", "value": 36.2, "unit": "%"}
        state.telemetry["checks"]["disk"] = {"name": "Disk Usage (/)", "status": "OK", "value": 21.0, "unit": "%"}
        state.telemetry["overall_health"] = "HEALTHY"
        
        state.is_running_pipeline = False
        state.current_action = None

    async def run_puppet_enforce(self):
        state.is_running_pipeline = True
        state.current_action = "Puppet Configuration Compliance"
        state.compliance["status"] = "enforcing"
        
        logs = [
            ("Executing: puppet apply /etc/puppetlabs/code/environments/production/manifests/site.pp", 0.6),
            ("Info: Loading facts...", 0.8),
            ("Info: Loading facts in /var/lib/puppet/lib/facter...", 0.5),
            ("Notice: Compiled catalog for devops-cloud-node in environment production in 0.42 seconds", 0.9),
            ("Info: Applying configuration version '1714541982'", 0.5),
            ("Notice: /Stage[main]/Main/Package[nagios-nrpe-server]/ensure: ensure changed 'purged' to 'present'", 0.9),
            ("Notice: /Stage[main]/Main/Package[fail2ban]/ensure: ensure changed 'purged' to 'present'", 0.8),
            ("Notice: /Stage[main]/Main/File[/etc/motd]/content: content changed '{md5}a4b79' to '{md5}8f1c3'", 0.7),
            ("Notice: /Stage[main]/Main/File[/etc/ssh/sshd_config.d/99-hardened.conf]/ensure: created", 0.7),
            ("Notice: /Stage[main]/Main/Service[ssh]: Triggered 'refresh' from 1 event", 0.6),
            ("Notice: /Stage[main]/Main/File[/etc/nagios/nrpe.cfg]/ensure: created", 0.7),
            ("Notice: /Stage[main]/Main/Service[nagios-nrpe-server]: Triggered 'refresh' from 1 event", 0.6),
            ("Notice: /Stage[main]/Main/Exec[enable_ufw]/returns: executed successfully", 0.8),
            ("Notice: Applied catalog in 1.48 seconds", 0.6),
            ("✔ Compliance verification complete: Server matches declared desired state. 0 drift violations.", 0.5)
        ]
        
        for text, delay in logs:
            state.add_log(text, stage="PUPPET")
            await asyncio.sleep(delay * 0.35)
            
        state.compliance.update({
            "status": "compliant",
            "last_enforced": time.strftime("%Y-%m-%d %H:%M:%S"),
            "drift_count": 0
        })
        
        # If there was a tamper/drift fault injected, heal it
        if state.chaos["active_fault"] == "config_tamper":
            state.chaos["active_fault"] = None
            state.chaos["description"] = None
            state.clear_alerts_for_service("puppet_drift")
            state.add_alert("INFO", "Configuration Remediated", "Puppet restored /etc/motd and SSH baseline policies to compliance.", "puppet_drift")
            
        state.is_running_pipeline = False
        state.current_action = None

    async def run_nagios_probe(self):
        state.telemetry["last_check"] = time.strftime("%H:%M:%S")
        
        # If active fault is http_down
        if state.chaos["active_fault"] == "http_down":
            state.telemetry["checks"]["http"] = {
                "name": "HTTP Service (Port 80)",
                "status": "CRITICAL",
                "code": 502,
                "response_time_ms": 0
            }
            state.telemetry["overall_health"] = "CRITICAL"
            return
            
        # If active fault is cpu_spike
        if state.chaos["active_fault"] == "cpu_spike":
            cpu_val = round(random.uniform(92.0, 98.5), 1)
            state.telemetry["checks"]["cpu"] = {
                "name": "CPU Utilization",
                "status": "CRITICAL",
                "value": cpu_val,
                "unit": "%"
            }
            state.telemetry["overall_health"] = "CRITICAL"
            return
            
        # Normal healthy fluctuation
        if state.deployment["status"] == "deployed":
            cpu_val = round(random.uniform(14.0, 26.0), 1)
            mem_val = round(random.uniform(34.0, 39.0), 1)
            latency = round(random.uniform(28.0, 48.0), 1)
            
            state.telemetry["checks"]["ping"]["latency_ms"] = round(random.uniform(20.0, 28.0), 1)
            state.telemetry["checks"]["http"] = {
                "name": "HTTP Service (Port 80)",
                "status": "OK",
                "code": 200,
                "response_time_ms": latency
            }
            state.telemetry["checks"]["ssh"]["status"] = "OK"
            state.telemetry["checks"]["cpu"]["value"] = cpu_val
            state.telemetry["checks"]["cpu"]["status"] = "OK"
            state.telemetry["checks"]["memory"]["value"] = mem_val
            state.telemetry["checks"]["memory"]["status"] = "OK"
            state.telemetry["checks"]["disk"]["value"] = 21.0
            state.telemetry["checks"]["disk"]["status"] = "OK"
            state.telemetry["overall_health"] = "HEALTHY"

    async def inject_chaos(self, fault_type: str):
        state.chaos["active_fault"] = fault_type
        state.chaos["injected_at"] = time.strftime("%H:%M:%S")
        
        if fault_type == "http_down":
            state.chaos["description"] = "Simulated Web Server Service Crash (systemctl stop nginx)"
            state.telemetry["checks"]["http"] = {
                "name": "HTTP Service (Port 80)",
                "status": "CRITICAL",
                "code": 502,
                "response_time_ms": 0
            }
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert(
                "CRITICAL",
                "Service Down: HTTP Port 80 Connection Refused",
                "Web application is unreachable. Nagios check_http returned CRITICAL status.",
                "http_service"
            )
            state.add_log("[CRITICAL ALERT] Nagios: HTTP check failed on port 80 - Connection Refused!", stream="stderr", stage="NAGIOS")
            
        elif fault_type == "cpu_spike":
            state.chaos["description"] = "High CPU Stress Injection (stress-ng --cpu 4 --timeout 60s)"
            state.telemetry["checks"]["cpu"] = {
                "name": "CPU Utilization",
                "status": "CRITICAL",
                "value": 96.8,
                "unit": "%"
            }
            state.telemetry["overall_health"] = "CRITICAL"
            state.add_alert(
                "CRITICAL",
                "High Resource Alarm: CPU Load 96.8%",
                "NRPE check_load reported threshold violation (Critical > 90%).",
                "cpu_utilization"
            )
            state.add_log("[CRITICAL ALERT] Nagios: check_load CRITICAL - 96.8% exceeds threshold 90%", stream="stderr", stage="NAGIOS")
            
        elif fault_type == "config_tamper":
            state.chaos["description"] = "Unauthorized Configuration Drift (/etc/motd tampered, SSH config altered)"
            state.compliance["status"] = "drift_detected"
            state.compliance["drift_count"] = 2
            state.telemetry["overall_health"] = "WARNING"
            state.add_alert(
                "WARNING",
                "Puppet Configuration Drift Detected",
                "Unauthorized modification detected in /etc/motd and SSH security policy.",
                "puppet_drift"
            )
            state.add_log("[WARNING] Drift Detector: Target node has diverged from approved Puppet manifest!", stream="stderr", stage="PUPPET")

    async def heal_chaos(self):
        fault = state.chaos["active_fault"]
        if not fault:
            return
            
        state.add_log(f"Initiating Automated Remediation for fault [{fault}]...", stage="SYSTEM")
        await asyncio.sleep(0.8)
        
        if fault == "http_down":
            server = state.deployment["web_server"]
            state.add_log(f"Ansible Service Handler: restarting {server} daemon...", stage="ANSIBLE")
            await asyncio.sleep(1.0)
            state.telemetry["checks"]["http"] = {
                "name": "HTTP Service (Port 80)",
                "status": "OK",
                "code": 200,
                "response_time_ms": 36.1
            }
            state.clear_alerts_for_service("http_service")
            state.add_alert("INFO", "Service Restored: HTTP Port 80", f"{server.upper()} service restarted and verified responsive.", "http_service")
            state.add_log(f"✔ Nagios: HTTP check recovered to OK (200 OK, latency 36.1ms)", stage="NAGIOS")
            
        elif fault == "cpu_spike":
            state.add_log("Terminating stress workloads and cooling CPU cores...", stage="SYSTEM")
            await asyncio.sleep(1.0)
            state.telemetry["checks"]["cpu"] = {
                "name": "CPU Utilization",
                "status": "OK",
                "value": 19.4,
                "unit": "%"
            }
            state.clear_alerts_for_service("cpu_utilization")
            state.add_alert("INFO", "CPU Utilization Normal", "Load average returned to normal operating range (19.4%).", "cpu_utilization")
            state.add_log("✔ Nagios: check_load returned to OK (19.4%)", stage="NAGIOS")
            
        elif fault == "config_tamper":
            await self.run_puppet_enforce()
            
        state.chaos["active_fault"] = None
        state.chaos["description"] = None
        state.telemetry["overall_health"] = "HEALTHY"

simulator = SimulationEngine()
