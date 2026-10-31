# Laboratory Demonstration Script & Examiner Walkthrough

This guide provides a structured 5-minute live demonstration script to present to your faculty instructor, course examiner, or project evaluation committee.

---

### Step-by-Step Examiner Walkthrough (5-Minute Demo)

#### Step 1: Launch the Platform
1. Run `start.bat` (Windows) or `bash start.sh` (Linux / Mac).
2. The browser automatically navigates to `http://127.0.0.1:8000`.
3. Point out the clean **Glassmorphic Dark Theme**, showing the active tools: **AWS EC2 | Terraform | Ansible | Puppet | Nagios**.
4. Show the mode badge in the top right: **MODE: SIMULATION** (or click to switch to **LIVE AWS**).

#### Step 2: Provision Cloud Infrastructure (Terraform)
1. Point to **Step 1: Terraform Infrastructure as Code**.
2. Explain: *"Here we select AWS Region `us-east-1` and EC2 type `t2.micro`. Terraform will provision the VPC, dynamic security group, and 4096-bit RSA key pair."*
3. Click **"Provision Infrastructure (Terraform Apply)"**.
4. Watch the **Live Terminal** below stream the Terraform execution plan and resource creation.
5. Point out the newly populated Target IP (`54.210.88.142`) and Security Group ID in the top cards.

#### Step 3: Configure and Deploy the Web Application (Ansible)
1. Point to **Step 2: Ansible Web Server & App Deployment**.
2. Explain: *"Now we execute our Ansible playbook. We can deploy either Nginx or Apache HTTP Server idempotently."*
3. Keep **Nginx** selected and click **"Deploy Stack (Ansible Playbook)"**.
4. Watch the terminal output show Ansible tasks: `[Gathering Facts]`, `[Install Nginx]`, `[Deploy Web Application]`, and `[Verify HTTP 200]`.
5. Point out the new **"Open App ↗"** button that links to the deployed web application!

#### Step 4: Enforce Security Compliance & Drift Control (Puppet)
1. Point to **Step 3: Puppet Configuration Drift & Compliance**.
2. Explain: *"Ansible deploys the application, but Puppet enforces our ongoing security baseline and prevents configuration drift."*
3. Click **"Enforce Compliance (Puppet Apply)"**.
4. Watch Puppet apply the catalog, hardening SSH settings (`MaxAuthTries 4`, `X11Forwarding no`) and creating the compliance `/etc/motd` banner.
5. All checklist items turn green with **"100% Compliant"**.

#### Step 5: Continuous Health Monitoring (Nagios Core)
1. Point to **Step 4: Nagios Health Probing & Service Monitoring**.
2. Show the real-time telemetry gauges: **CPU Utilization (18%)**, **RAM (36%)**, **Disk (21%)**, and **HTTP Port 80 (200 OK - 38ms)**.
3. Show the active status badge: **HEALTHY (All Checks Passing)**.

#### Step 6: The "Grand Finale" — Chaos Engineering & Auto-Remediation
1. Scroll to the **Chaos Engineering & Failure Simulation Lab**.
2. Tell the examiner: *"To prove our monitoring and self-healing automation, let's simulate a sudden web server crash."*
3. Click **"Simulate Web Crash (HTTP 502)"**.
4. **Instant Result**:
   * The Nagios HTTP gauge turns red (`CRITICAL - Connection Refused`).
   * The active alert log flashes: `[CRITICAL] Service Down: HTTP Port 80 Connection Refused`.
   * The platform state turns to **CRITICAL**.
5. Click **"Auto-Remediate & Heal All"**.
6. **Watch the Recovery**:
   * The self-healing script restarts the service.
   * Nagios re-probes port 80.
   * Status recovers to **HEALTHY (200 OK)**!
7. Conclude: *"This demonstrates a closed-loop automated DevOps lifecycle: Provision, Deploy, Enforce, Observe, and Auto-Heal."*
