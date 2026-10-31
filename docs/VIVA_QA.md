# Comprehensive DevOps Class Viva & Project Oral Defense Guide

This document contains essential questions, deep technical answers, and evaluation criteria designed to prepare students for college viva examinations and project presentations.

---

### Section 1: Infrastructure as Code (Terraform & AWS)

#### Q1: What is Infrastructure as Code (IaC), and what problems does it solve?
**Answer**:
Infrastructure as Code (IaC) is the practice of managing and provisioning computer data center infrastructure through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools.
It eliminates:
1. **Configuration Drift**: Servers differing due to manual tweaks.
2. **Human Error**: Typos or missed steps in cloud consoles.
3. **Slow Provisioning**: Deployments take minutes instead of weeks.
4. **Lack of Version Control**: Infrastructure changes can be tracked in Git and peer-reviewed.

#### Q2: Why use Terraform over AWS CloudFormation or manual AWS Console clicking?
**Answer**:
1. **Cloud Agnostic**: Terraform works across AWS, Azure, GCP, and Kubernetes using providers, whereas CloudFormation is AWS-specific.
2. **State Management**: Terraform maintains a state file (`terraform.tfstate`) that maps real-world resources to your configuration, allowing precise delta calculation (`terraform plan`).
3. **Declarative Syntax**: You describe *what* you want (e.g., an EC2 instance and a security group), and Terraform determines *how* to achieve it, including optimal dependency ordering.

#### Q3: What is the purpose of `terraform plan`?
**Answer**:
`terraform plan` performs an execution dry-run. It refreshes current state from the cloud provider, compares it against the local `.tf` configuration files, and displays an exact list of actions:
* `+` resources to create
* `~` resources to update in-place
* `-` resources to destroy

---

### Section 2: Configuration Management (Ansible)

#### Q4: What is the difference between Ansible and Terraform? Can Ansible replace Terraform?
**Answer**:
* **Terraform** is primarily an **Infrastructure Provisioning Tool** (creates VPCs, subnets, EC2 instances, DNS records).
* **Ansible** is primarily a **Configuration Management & Application Deployment Tool** (installs packages, updates configs, starts services, deploys code).
* While Ansible has cloud modules, it lacks Terraform's state graph engine. Combining them represents best practices: **Terraform provisions the infrastructure; Ansible configures the servers**.

#### Q5: What does "Idempotence" mean in Ansible?
**Answer**:
An operation is idempotent if executing it multiple times produces the exact same outcome without causing unintended side effects. For example, if Ansible's `apt` module checks that `nginx` is installed and finds it already present, it marks the task `ok` without reinstalling or interrupting the running service.

#### Q6: Why is Ansible considered "Agentless"?
**Answer**:
Ansible does not require any background agent or daemon installed on the managed target nodes. It communicates purely over standard **OpenSSH** on Linux (or WinRM on Windows) and executes standard Python code or shell commands, drastically reducing server overhead and attack surface.

---

### Section 3: Compliance & Drift Enforcement (Puppet)

#### Q7: If we already use Ansible to configure the server, why do we need Puppet?
**Answer**:
* **Ansible** is predominantly a **Push-Based Orchestrator**: it executes when triggered by a CI/CD pipeline or engineer. If someone logs onto the server two hours later and deletes an important file, Ansible doesn't know until the next manual deployment run.
* **Puppet** is a **Declarative Desired-State Engine**: it defines continuous compliance baselines. In enterprise architectures, Puppet manifests enforce security policies (like SSH hardening, required packages, and file permissions) and automatically heal drift if unauthorized changes occur.

#### Q8: What is "Configuration Drift"?
**Answer**:
Configuration Drift occurs when system configurations diverge over time from their original declared baseline due to manual hotfixes, unrecorded emergency changes, or software updates. Puppet resolves drift by comparing actual system state against its compiled catalog and automatically applying corrective actions.

---

### Section 4: System Monitoring & Telemetry (Nagios Core)

#### Q9: How does Nagios monitor server health in this project?
**Answer**:
Nagios employs two distinct monitoring approaches:
1. **Network-Level Probes (Agentless)**: Probing TCP Port 22 (SSH) and HTTP Port 80 (`/healthz` endpoint) to measure response time, uptime, and HTTP status codes (200 OK vs 500/502).
2. **NRPE (Nagios Remote Plugin Executor)**: An agent running on the target EC2 node that securely executes internal diagnostic scripts (such as `check_load`, `check_disk`, and `check_mem`) and returns standard Nagios status codes back to the monitoring server.

#### Q10: What are the standard return codes for Nagios check plugins?
**Answer**:
* `0`: **OK** (All metrics within normal operating bounds)
* `1`: **WARNING** (Metric exceeded soft threshold, e.g. CPU > 75%)
* `2`: **CRITICAL** (Metric exceeded emergency threshold, e.g. service down or CPU > 90%)
* `3`: **UNKNOWN** (Check could not be evaluated, e.g. network timeout or plugin syntax error)

---

### Section 5: Web UI & Orchestration Architecture

#### Q11: How does the Web UI interact with the underlying DevOps tools?
**Answer**:
The platform utilizes a **FastAPI Asynchronous Backend** acting as an Orchestrator. When a user clicks a button in the React UI:
1. The UI sends a REST request (e.g., `POST /api/ansible/deploy`).
2. The FastAPI backend triggers the asynchronous task (either via native subprocess/Paramiko SSH or the realistic simulation engine).
3. The backend streams real-time stdout/stderr lines line-by-line across a **WebSocket connection** (`/ws/logs`).
4. The React terminal component renders these log lines with timestamps and color badges in real time.

#### Q12: How does the Chaos Engineering simulation prove system resilience?
**Answer**:
In the Chaos Lab:
1. Clicking **"Simulate Web Crash"** stops the web server process.
2. The background Nagios health poller detects the service failure on port 80 within seconds and updates the telemetry status to **CRITICAL**.
3. The UI sounds a critical alert and highlights the active outage banner.
4. Clicking **"Auto-Remediate"** triggers the self-healing routine (via Puppet/Ansible), which restarts the service and restores Nagios health status back to **HEALTHY (200 OK)**.

