# CloudOps Studio — Concise Slide Deck (Ready for PowerPoint)

---

### Slide 1: Title & Overview
* **CloudOps Studio**
* Autonomous Cloud Infrastructure, Deployment & Self-Healing Platform
* **Stack:** Terraform • Ansible • Puppet • Nagios • AWS Cloud
* **Core Goal:** Unified single-pane-of-glass dashboard for complete DevOps automation.

---

### Slide 2: Problem Statement
* **Toolchain Fragmentation:** Developers juggle 4–5 disconnected CLIs with no unified view.
* **Configuration Drift:** Manual hot-fixes cause silent bugs and security vulnerabilities.
* **Cost & Billing Risks:** Beginners risk surprise AWS bills while practicing on live cloud.
* **Manual Recovery:** Outages require 3 AM manual SSH logins to restart services.

---

### Slide 3: Project Flow & Architecture
* **Step 1 (Terraform):** Provisions AWS VPC, Security Groups, and EC2 instance.
* **Step 2 (Ansible):** Configures Nginx, background daemons, and deploys app code.
* **Step 3 (Puppet):** Hardens SSH, installs fail2ban, and enforces zero configuration drift.
* **Step 4 (Nagios):** Probes HTTP, API, Database, and hardware health every 4 seconds.
* **Step 5 (Chaos Lab):** Injects faults and triggers autonomous 1-click self-healing.

---

### Slide 4: Terraform — Infrastructure as Code (IaC)
* **Automated Cloud Creation:** Launches EC2 instances in AWS Mumbai (`ap-south-1`) in seconds.
* **Dynamic Key Pairs:** Generates 4096-bit RSA keys on-the-fly without hardcoded secrets.
* **Least-Privilege Security:** Configures security group rules (Ports 22, 80, 443, 8000, 5432).
* **Free-Tier Protected:** Locked to `t2.micro` instances to eliminate cost overruns.

---

### Slide 5: Ansible — Provisioning & Deployment
* **Agentless Architecture:** Pushes configurations over native SSH without background agents.
* **Idempotent Playbooks:** Checks state first; running twice produces zero side-effects.
* **Zero-Downtime Daemons:** Sets up systemd units for automatic app recovery on reboot.
* **Smoke Testing:** Automatically verifies HTTP 200 OK before marking deployment complete.

---

### Slide 6: Puppet — Security & Zero Drift
* **Golden Baseline:** Continuously enforces desired system configuration.
* **SSH Hardening:** Disables root password logins; enforces cryptographic key access.
* **Intrusion Prevention:** Automates `fail2ban` deployment and locks down UFW firewall.
* **Zero Configuration Drift:** Detects unauthorized file edits and restores approved settings.

---

### Slide 7: Nagios — Real-Time Telemetry
* **Continuous Probes:** Multi-layer health checks executed every 4 seconds.
* **Full-Stack Inspection:** Web (Port 80), Backend API (Port 8000), DB (5432), and Host Ping.
* **Real Hardware Metrics:** Real-time extraction of CPU load, RAM usage, and disk space.
* **Non-Blocking Engine:** Threadpool probes ensure sub-second response without UI freezing.

---

### Slide 8: Chaos Engineering & Auto-Healing
* **Controlled Fault Injection:** 1-click simulation of Nginx crashes, CPU spikes, or port blocks.
* **Fast Failure Detection:** Nagios flags outages as **CRITICAL (Red)** within 2–3 seconds.
* **Closed-Loop Healing:** Automated recovery script restarts daemons and clears locks.
* **Autonomous Recovery:** Restores system health back to **100% HEALTHY (Green)** with zero manual SSH.

---

### Slide 9: Unique Selling Proposition (USP) & Impact
* **Dual-Engine Flexibility:** Instant toggle between zero-cost Simulation and Live AWS Mode.
* **Unified Single Pane:** Combines 4 separate enterprise DevOps tools into one workflow.
* **Live WebSocket Streaming:** Terminal logs stream line-by-line with zero page refreshes.
* **Dynamic Multi-Project:** Host, switch, and monitor multiple deployments without cross-talk.
