import React from 'react';
import {
  Layers,
  Package,
  ShieldCheck,
  Activity,
  Flame,
  ArrowRight,
  Server,
  Lock,
  Cpu,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Settings,
  PlusCircle,
  FolderUp,
} from 'lucide-react';
import { ExecutionMode, FullStatus } from '../types';

interface ConsoleOverviewProps {
  status: FullStatus;
  mode: ExecutionMode;
  onNavigate: (tabId: string) => void;
  onOpenConfig: () => void;
  onNewProject: () => void;
}

export const ConsoleOverview: React.FC<ConsoleOverviewProps> = React.memo(({
  status,
  mode,
  onNavigate,
  onOpenConfig,
  onNewProject,
}) => {
  const isTfDone = status.infrastructure.status === 'ready';
  const isAnsDone = status.deployment.status === 'deployed';
  const isPupDone = status.compliance.status === 'compliant';
  const isNagDone = isTfDone && isAnsDone && isPupDone && Boolean(status.telemetry.last_check);

  const capabilities = [
    {
      icon: Layers,
      color: 'var(--accent-terraform)',
      bg: 'rgba(124, 58, 237, 0.12)',
      title: 'Infrastructure as Code (Terraform)',
      desc: 'Automates provisioning of AWS VPCs, Subnets, Internet Gateways, Security Groups, dynamic 4096-bit RSA key pairs, and Ubuntu 22.04 LTS EC2 nodes in your chosen region (ap-south-1).',
      tag: 'Step 1: IaC',
    },
    {
      icon: Package,
      color: 'var(--accent-ansible)',
      bg: 'rgba(239, 68, 68, 0.12)',
      title: 'Polyglot App Deployment (Ansible)',
      desc: 'Orchestrates full-stack application runtimes behind NGINX reverse proxy, provisions databases (PostgreSQL/MySQL/MongoDB), and supports Node.js, Spring Boot (.jar), Python FastAPI, or Universal Docker.',
      tag: 'Step 2: Deploy',
    },
    {
      icon: ShieldCheck,
      color: 'var(--accent-puppet)',
      bg: 'rgba(245, 158, 11, 0.12)',
      title: 'Security & Drift Compliance (Puppet)',
      desc: 'Applies automated security hardening baselines: disables SSH root login, restricts auth retries, configures fail2ban, enables firewall rules, and continuously enforces zero configuration drift.',
      tag: 'Step 3: Compliance',
    },
    {
      icon: Activity,
      color: 'var(--accent-nagios)',
      bg: 'rgba(16, 185, 129, 0.12)',
      title: 'Full-Stack Telemetry (Nagios)',
      desc: 'Provides multi-tier synthetic health checks: ICMP ping latency, HTTP/HTTPS response times, service daemon statuses, and live CPU, RAM, and Disk storage usage graphs.',
      tag: 'Step 4: Observability',
    },
    {
      icon: Flame,
      color: 'var(--status-danger)',
      bg: 'rgba(220, 38, 38, 0.12)',
      title: 'Chaos Engineering & Auto-Remediation',
      desc: 'Simulate realistic outages (Frontend NGINX crash, Backend API failure, Database downtime, CPU spikes, unauthorized config tampering) and trigger automated self-healing reconciliation.',
      tag: 'Chaos Lab',
    },
    {
      icon: PlusCircle,
      color: 'var(--aws-orange)',
      bg: 'rgba(255, 153, 0, 0.12)',
      title: 'Multi-Project AWS Node Management',
      desc: 'Deploy multiple independent applications on dedicated AWS EC2 instances, track them in your Projects Registry, and toggle between them to monitor each node in real-time.',
      tag: 'Multi-Project',
    },
  ];

  const workflowSteps = [
    {
      stepNum: 0,
      title: '0. Pre-Flight Check & Preparation',
      targetTab: 'preflight',
      isComplete: true,
      color: 'var(--aws-orange)',
      actionText: 'Review Pre-Flight Checklist',
      instructions: [
        'Inspect your application manifest, package dependencies, and framework port assignments.',
        'Verify target host port bindings (Frontend: Port 80, Backend API: Port 8000/5000/8080, DB: 5432/3306).',
        'Ensure health route (/api/health or /) is ready for synthetic probing.',
      ],
    },
    {
      stepNum: 1,
      title: '1. Provision Cloud Infrastructure (Terraform)',
      targetTab: 'tf',
      isComplete: isTfDone,
      color: 'var(--accent-terraform)',
      actionText: 'Go to Step 1: Terraform IaC',
      instructions: [
        'Navigate to Step 1: Terraform IaC from the sidebar or stepper above.',
        'Choose your AWS region (default: ap-south-1 Mumbai) and instance type (t2.micro Free Tier eligible).',
        'Click "Apply (Terraform)" to initialize the provider, create VPC & Security Groups, and launch the Ubuntu EC2 node.',
        'Review the assigned Public IP address and copy the SSH connection string once ready.',
      ],
    },
    {
      stepNum: 2,
      title: '2. Deploy Polyglot Application Stack (Ansible)',
      targetTab: 'ans',
      isComplete: isAnsDone,
      color: 'var(--accent-ansible)',
      actionText: 'Go to Step 2: Ansible Deploy',
      instructions: [
        'Navigate to Step 2: Full-Stack Deploy to configure your application runtime.',
        'Select a pre-built preset (Node.js Express, Spring Boot, Python FastAPI, Universal Docker, or Static HTML) OR drag-and-drop your custom project folder/zip.',
        'Click "Deploy Stack" — Ansible will establish SSH, configure NGINX reverse proxy, provision the database, and launch your application daemon.',
        'Once deployed, click "Open Website" to view your live web application on your AWS Public IP.',
      ],
    },
    {
      stepNum: 3,
      title: '3. Enforce Security Baseline & Drift Policies (Puppet)',
      targetTab: 'pup',
      isComplete: isPupDone,
      color: 'var(--accent-puppet)',
      actionText: 'Go to Step 3: Puppet Baseline',
      instructions: [
        'Navigate to Step 3: Puppet Baseline to enforce enterprise security hardening.',
        'Click "Enforce Compliance" — Puppet compiles catalogs and applies desired-state configurations.',
        'Verifies zero drift: enforces SSH MaxAuthTries, sets compliance MOTD banner, enables fail2ban, and locks firewall rules.',
      ],
    },
    {
      stepNum: 4,
      title: '4. Monitor Telemetry & Observability (Nagios)',
      targetTab: 'nag',
      isComplete: isNagDone,
      color: 'var(--accent-nagios)',
      actionText: 'Go to Step 4: Nagios Telemetry',
      instructions: [
        'Navigate to Step 4: Nagios Telemetry to inspect active service health sensors.',
        'Click "Probe Now" to run live synthetic checks across Frontend (80), Backend API, Database, and SSH.',
        'Inspect real-time system metrics: Network ping latency, CPU utilization %, RAM memory %, and Disk storage %.',
      ],
    },
    {
      stepNum: 5,
      title: '5. Chaos Engineering & Multi-Project Deployment',
      targetTab: 'chaos',
      isComplete: false,
      color: 'var(--status-danger)',
      actionText: 'Go to Chaos Engineering Lab',
      instructions: [
        'Visit Chaos Lab to simulate real-world failure scenarios (crash services, stress CPU, tamper configuration).',
        'Click "Auto-Remediate" or "Puppet Reconcile & Heal" to test automated recovery without rebuilding infrastructure.',
        'Click "+ Deploy New Project" in the top bar anytime to archive the current deployment and launch another project stack.',
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Executive Banner */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              background: 'rgba(255, 153, 0, 0.12)',
              border: '1px solid rgba(255, 153, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--aws-orange)',
              flexShrink: 0,
            }}
          >
            <BookOpen size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              CloudOps Platform Guide & Deployment Instructions
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', margin: '0.25rem 0 0 0' }}>
              Follow these instructions to configure, provision, deploy, and monitor your cloud application stacks on AWS.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.75rem',
              borderRadius: '20px',
              background: mode === 'live' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(14, 165, 233, 0.12)',
              border: `1px solid ${mode === 'live' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(14, 165, 233, 0.3)'}`,
              fontSize: '0.75rem',
              fontWeight: 700,
              color: mode === 'live' ? 'var(--status-success)' : 'var(--accent-nagios)',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: mode === 'live' ? 'var(--status-success)' : 'var(--accent-nagios)',
              }}
            />
            <span>{mode.toUpperCase()} MODE ACTIVE</span>
          </div>

          <button
            onClick={onOpenConfig}
            className="btn-secondary"
            style={{ fontSize: '0.76rem', height: '32px', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.75rem' }}
            title="Configure AWS Region and Credentials"
          >
            <Settings size={13} />
            <span>Cloud Config</span>
          </button>

          <button
            onClick={onNewProject}
            className="btn-primary"
            style={{ fontSize: '0.76rem', height: '32px', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0 0.85rem' }}
            title="Start a new project deployment"
          >
            <PlusCircle size={13} />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* 2. Platform Capabilities ("What You Can Do on this Platform") */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Sparkles size={16} color="var(--aws-orange)" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            What You Can Do on this Platform
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: '0.85rem' }}>
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.55rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: cap.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: cap.color,
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: cap.color,
                      background: cap.bg,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '10px',
                    }}
                  >
                    {cap.tag}
                  </span>
                </div>
                <h5 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {cap.title}
                </h5>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.45 }}>
                  {cap.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Step-by-Step Instructions ("What You Should Follow") */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Server size={16} color="var(--aws-orange)" />
          <h4 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Deployment Workflow & Instructions to Follow
          </h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {workflowSteps.map((step) => (
            <div
              key={step.stepNum}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '1.15rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: step.isComplete ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-subtle)',
                      border: `1px solid ${step.isComplete ? 'var(--status-success)' : 'var(--border-color)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.isComplete ? 'var(--status-success)' : step.color,
                      fontWeight: 800,
                      fontSize: '0.82rem',
                    }}
                  >
                    {step.isComplete ? <CheckCircle2 size={16} /> : step.stepNum}
                  </div>
                  <div>
                    <h5 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {step.title}
                    </h5>
                    {step.isComplete && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', fontWeight: 700 }}>
                        Completed & Verified
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(step.targetTab)}
                  className="btn-secondary"
                  style={{
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    borderRadius: '6px',
                    borderColor: step.color,
                    color: 'var(--text-primary)',
                  }}
                >
                  <span>{step.actionText}</span>
                  <ArrowRight size={13} color={step.color} />
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '0.75rem 0.95rem',
                }}
              >
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Action Guide:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {step.instructions.map((inst, i) => (
                    <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.45 }}>
                      {inst}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Quick Architecture & Free Tier Guidelines */}
      <div
        style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Lock size={18} color="var(--aws-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Sequential Guardrails
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              The pipeline is strictly ordered: provision infrastructure with Step 1 (Terraform) before deploying applications with Step 2 (Ansible).
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <FolderUp size={18} color="var(--accent-ansible)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              Polyglot Application Stacks
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              In Step 2, configure and deploy Python FastAPI, Node.js Express, Java Spring Boot, or Docker containers via automated Ansible playbooks.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <Cpu size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
              AWS Free Tier Ready
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              Pre-configured with <code style={{ color: 'var(--aws-orange)' }}>t2.micro</code> instances and gp3 storage to stay completely within AWS Free Tier limits.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
