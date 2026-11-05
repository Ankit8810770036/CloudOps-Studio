import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { TopStats } from './components/TopStats';
import { MetricCharts } from './components/MetricCharts';
import { TerraformStep } from './components/TerraformStep';
import { AnsibleStep } from './components/AnsibleStep';
import { PuppetStep } from './components/PuppetStep';
import { NagiosStep } from './components/NagiosStep';
import { ChaosPanel } from './components/ChaosPanel';
import { Terminal } from './components/Terminal';
import { ConfigModal } from './components/ConfigModal';
import { VivaModal } from './components/VivaModal';
import { PipelineStepper } from './components/PipelineStepper';
import { StepCompletionNotification, StepCompletionData } from './components/StepCompletionNotification';
import { PreDeploymentChecklist } from './components/PreDeploymentChecklist';

import {
  fetchStatus,
  fetchConfig,
  setExecutionMode,
  applyTerraform,
  destroyTerraform,
  deployAnsible,
  enforcePuppet,
  probeNagios,
  injectChaos,
  healChaos,
  clearLogs,
  connectLogWebSocket,
} from './services/api';
import { FullStatus, LogEntry } from './types';
import { Layers, Package, ShieldCheck, Activity, Flame, Terminal as TerminalIcon, LayoutDashboard, AlertTriangle, Key, X } from 'lucide-react';

export interface ModeAlertData {
  title: string;
  message: string;
  type: 'warning' | 'error' | 'info' | 'success';
}

export function App() {
  const [status, setStatus] = useState<FullStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('ap-south-1');

  // Theme: 'dark' (Enterprise NOC) or 'light' (Clean Dev Studio)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('cloudops_theme') as 'dark' | 'light') || 'dark';
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLiveModeRequired, setIsLiveModeRequired] = useState(false);
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [modeAlert, setModeAlert] = useState<ModeAlertData | null>(null);

  // Auto-dismiss mode alert after 10 seconds
  useEffect(() => {
    if (modeAlert) {
      const timer = setTimeout(() => {
        setModeAlert(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [modeAlert]);

  // Real-time confirmation message for completed steps
  const [completionNotice, setCompletionNotice] = useState<StepCompletionData | null>(null);
  const prevInfraStatus = useRef<string | undefined>(undefined);
  const prevDeployStatus = useRef<string | undefined>(undefined);
  const prevComplianceStatus = useRef<string | undefined>(undefined);
  const prevTelemetryHealth = useRef<string | undefined>(undefined);
  const initialMount = useRef<boolean>(true);

  const mainContentRef = useRef<HTMLElement>(null);

  // Tab switching with instant scroll-to-top (Memoized to prevent unnecessary re-renders)
  const handleSelectTab = useCallback((tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, []);

  // Scroll to top immediately whenever activeTab changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [activeTab]);

  // Lock background scroll whenever any dialog card or form modal is open
  useEffect(() => {
    const isAnyModalOpen = isConfigOpen || isVivaOpen;
    if (isAnyModalOpen) {
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;

      // Prevent layout shift from scrollbar disappearing
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.body.classList.add('modal-open');

      return () => {
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
        document.body.style.paddingRight = originalPaddingRight;
        document.body.classList.remove('modal-open');
      };
    }
  }, [isConfigOpen, isVivaOpen]);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cloudops_theme', theme);
  }, [theme]);

  // Poll status periodically
  useEffect(() => {
    const update = () => {
      fetchStatus()
        .then(setStatus)
        .catch(err => console.error('Status fetch error', err));
    };
    update();
    const interval = setInterval(update, 2500);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket for streaming logs with requestAnimationFrame batching (60fps smooth scroll protection)
  useEffect(() => {
    let frameId: number | null = null;
    let pendingBatch: LogEntry[] = [];

    const ws = connectLogWebSocket((entry) => {
      pendingBatch.push(entry);

      if (frameId === null) {
        frameId = requestAnimationFrame(() => {
          if (pendingBatch.length > 0) {
            const incoming = pendingBatch;
            pendingBatch = [];
            setLogs(prev => {
              const merged = [...prev, ...incoming];
              // Cap at 200 lines to prevent DOM bloat and scroll stutter
              return merged.length > 200 ? merged.slice(merged.length - 200) : merged;
            });
          }
          frameId = null;
        });
      }
    });

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId);
      ws.close();
    };
  }, []);

  // Monitor deployment pipeline state transitions and show on-screen confirmation notifications
  useEffect(() => {
    if (!status) return;

    const curInfra = status.infrastructure.status;
    const curDeploy = status.deployment.status;
    const curCompliance = status.compliance.status;
    const curHealth = status.telemetry.overall_health;

    // On first load, record existing states without triggering notification popups
    if (initialMount.current) {
      prevInfraStatus.current = curInfra;
      prevDeployStatus.current = curDeploy;
      prevComplianceStatus.current = curCompliance;
      prevTelemetryHealth.current = curHealth;
      initialMount.current = false;
      return;
    }

    // Step 1: Terraform IaC completed
    if (curInfra === 'ready' && prevInfraStatus.current !== 'ready') {
      setCompletionNotice({
        stepNumber: 1,
        stepName: 'Terraform IaC',
        title: 'Step 1 Complete: Infrastructure Provisioned',
        description: 'VPC and EC2 compute instance are ready.',
        details: [
          { label: 'Public IP', value: status.infrastructure.public_ip || 'Assigned' },
          { label: 'Instance ID', value: status.infrastructure.instance_id || 'i-ec2-node' },
          { label: 'Ports', value: '22, 80 open' },
          { label: 'Status', value: 'Ready for Ansible' }
        ],
        nextStepTab: 'ans',
        nextStepLabel: 'Proceed to Step 2: Ansible Deploy ➔'
      });
    }

    // Step 2: Ansible Full-Stack Deployment completed
    if (curDeploy === 'deployed' && prevDeployStatus.current !== 'deployed') {
      setCompletionNotice({
        stepNumber: 2,
        stepName: 'Ansible Deployment',
        title: 'Step 2 Complete: Stack Deployed',
        description: `Application stack running behind ${status.deployment.web_server.toUpperCase()} proxy.`,
        details: [
          { label: 'Server', value: status.deployment.web_server.toUpperCase() },
          { label: 'App', value: status.deployment.deployed_app || 'Polyglot Stack' },
          { label: 'Port', value: 'Port 80 (Active)' },
          { label: 'URL', value: status.infrastructure.app_url || `http://${status.infrastructure.public_ip}` }
        ],
        nextStepTab: 'pup',
        nextStepLabel: 'Proceed to Step 3: Puppet Baseline ➔',
        appUrl: status.infrastructure.app_url || (status.infrastructure.public_ip ? `http://${status.infrastructure.public_ip}` : undefined)
      });
    }

    // Step 3: Puppet Security & Configuration Baseline completed
    if (curCompliance === 'compliant' && prevComplianceStatus.current !== 'compliant') {
      setCompletionNotice({
        stepNumber: 3,
        stepName: 'Puppet Compliance',
        title: 'Step 3 Complete: Baseline Enforced',
        description: 'Security policies locked with zero drift detected.',
        details: [
          { label: 'Drift', value: '0 Violations' },
          { label: 'SSH', value: 'Root Disabled' },
          { label: 'Config', value: 'Nginx Locked' },
          { label: 'State', value: '100% Compliant' }
        ],
        nextStepTab: 'nag',
        nextStepLabel: 'Proceed to Step 4: Nagios Telemetry ➔'
      });
    }

    // Step 4: Nagios Observability completed (Healthy)
    if (curHealth === 'HEALTHY' && prevTelemetryHealth.current !== 'HEALTHY' && curDeploy === 'deployed') {
      setCompletionNotice({
        stepNumber: 4,
        stepName: 'Nagios Telemetry',
        title: 'Step 4 Complete: Telemetry Active',
        description: 'All system health probes passing.',
        details: [
          { label: 'Health', value: 'HEALTHY (100% UP)' },
          { label: 'Port 80', value: 'HTTP OK (200)' },
          { label: 'Port 22', value: 'SSH OK' },
          { label: 'Status', value: 'All Probes Passing' }
        ],
        nextStepTab: 'all',
        nextStepLabel: 'View Full Console Overview ➔',
        appUrl: status.infrastructure.app_url || (status.infrastructure.public_ip ? `http://${status.infrastructure.public_ip}` : undefined)
      });
    }

    prevInfraStatus.current = curInfra;
    prevDeployStatus.current = curDeploy;
    prevComplianceStatus.current = curCompliance;
    prevTelemetryHealth.current = curHealth;
  }, [status]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const handleToggleMode = useCallback(async () => {
    if (!status) return;

    if (status.mode === 'simulation') {
      // Switching from SIMULATION MODE to LIVE MODE -> check credentials first!
      try {
        const config = await fetchConfig();
        const hasAccess = Boolean(config.aws_access_key && config.aws_access_key.trim() && config.aws_access_key !== 'AKIAIOSFODNN7EXAMPLE');
        const hasSecret = Boolean(config.has_aws_keys || config.has_secret_key || (config.aws_secret_key_masked && config.aws_secret_key_masked.length > 0));

        if (!hasAccess || !hasSecret) {
          // Explicitly inform the user WHY they are not able to switch
          const missingParts = [];
          if (!hasAccess) missingParts.push('AWS Access Key ID');
          if (!hasSecret) missingParts.push('AWS Secret Access Key');

          const detailMsg = `Cannot switch to Live Mode: ${missingParts.join(' and ')} ${missingParts.length > 1 ? 'are' : 'is'} not configured. Please fill in your Default AWS Region (ap-south-1), Access Key ID, and Secret Key to connect to AWS.`;

          setModeAlert({
            title: 'Cannot Switch to Live Mode: AWS Credentials Required',
            message: detailMsg,
            type: 'warning'
          });

          // Add a high-visibility log into the live terminal stream
          setLogs(prev => [
            ...prev,
            {
              timestamp: new Date().toLocaleTimeString(),
              text: `[WARNING] ${detailMsg}`,
              stream: 'stderr',
              stage: 'SYSTEM'
            }
          ]);

          setIsLiveModeRequired(true);
          setIsConfigOpen(true);
          return;
        }

        // Credentials are fully filled -> switch to Live Mode directly
        await setExecutionMode('live');
        const updated = await fetchStatus();
        setStatus(updated);
        setModeAlert({
          title: 'Live AWS Cloud Mode Activated',
          message: 'Execution mode successfully switched to LIVE MODE. Actions will provision real AWS infrastructure in Region ap-south-1.',
          type: 'success'
        });
      } catch (err: any) {
        console.error('Mode toggle check error', err);
        const errMsg = err.message || 'AWS credentials verification failed.';
        setModeAlert({
          title: 'Cannot Switch to Live Mode',
          message: errMsg,
          type: 'error'
        });
        setIsLiveModeRequired(true);
        setIsConfigOpen(true);
      }
    } else {
      // Switching from LIVE MODE to SIMULATION MODE -> always allowed immediately
      await setExecutionMode('simulation');
      const updated = await fetchStatus();
      setStatus(updated);
      setModeAlert({
        title: 'Switched to Simulation Mode',
        message: 'Execution mode changed to SIMULATION MODE. Safe sandbox environment with mock cloud telemetry.',
        type: 'info'
      });
    }
  }, [status]);

  const handleApplyTerraform = useCallback(async (region: string, instanceType: string) => {
    await applyTerraform(region, instanceType);
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleDestroyTerraform = useCallback(async () => {
    await destroyTerraform();
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleDeployAnsible = useCallback(async (webServer: 'nginx' | 'apache', frontend: string, backend: string, database: string) => {
    await deployAnsible(webServer, frontend, backend, database);
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleEnforcePuppet = useCallback(async () => {
    await enforcePuppet();
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleProbeNagios = useCallback(async () => {
    await probeNagios();
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleInjectChaos = useCallback(async (faultType: string) => {
    await injectChaos(faultType);
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleHealChaos = useCallback(async () => {
    await healChaos();
    const updated = await fetchStatus();
    setStatus(updated);
  }, []);

  const handleClearLogs = useCallback(async () => {
    await clearLogs();
    setLogs([]);
  }, []);

  if (!status) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '0.85rem',
        background: 'var(--bg-global)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 6,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: 18, height: 18, border: '2px solid var(--aws-orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-dim)', fontWeight: 600 }}>Connecting to CloudOps Orchestrator...</p>
      </div>
    );
  }

  const isRunning = status.is_running_pipeline;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 1. Left-Hand Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenViva={() => setIsVivaOpen(true)}
        status={status}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar with In-Place Search */}
        <TopNavbar
          mode={status.mode}
          onToggleMode={handleToggleMode}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          status={status}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          onNavigate={handleSelectTab}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenViva={() => setIsVivaOpen(true)}
        />

        {/* Main Content Area */}
        <main className="content-container" ref={mainContentRef}>
          {/* Global Pipeline Stepper Progress */}
          <PipelineStepper
            status={status}
            activeTab={activeTab}
            onNavigate={handleSelectTab}
          />

          {/* SECTION 1: CONSOLE OVERVIEW (ALL) */}
          {activeTab === 'all' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <LayoutDashboard size={18} color="var(--aws-orange)" />
                    <span>Console Overview</span>
                  </div>
                  <div className="section-banner-sub">
                    Infrastructure, deployment, compliance, and observability.
                  </div>
                </div>
              </div>

              {/* Executive Metric Cards */}
              <TopStats status={status} />

              {/* Real-time Bezier Telemetry Charts */}
              <MetricCharts telemetry={status.telemetry} />

              {/* Chaos Engineering Panel */}
              <ChaosPanel
                chaos={status.chaos}
                infra={status.infrastructure}
                onInject={handleInjectChaos}
                onHeal={handleHealChaos}
                isRunning={isRunning}
              />

              {/* Separate Section: Pre-Deployment Project Readiness Check (Before Starting Pipeline Steps) */}
              <div style={{ marginBottom: '1.25rem' }}>
                <PreDeploymentChecklist
                  backendType={status.stack?.backend?.type || 'python'}
                  frontendType={status.stack?.frontend?.type || 'react'}
                  isInfraReady={status.infrastructure.status === 'ready'}
                  hasCustomCode={!!(status.custom_code?.backend || status.custom_code?.frontend)}
                  customCode={status.custom_code}
                  onProceed={() => handleSelectTab('tf')}
                  proceedLabel="Proceed to Step 1: Terraform IaC"
                  defaultOpen={false}
                  titlePrefix="Pre-Flight Readiness:"
                />
              </div>

              {/* 4 Pipeline Steps Grid (Equal Stretch Alignment) */}
              <div className="main-grid">
                <TerraformStep
                  infra={status.infrastructure}
                  onApply={handleApplyTerraform}
                  onDestroy={handleDestroyTerraform}
                  isRunning={isRunning}
                />
                <PuppetStep
                  compliance={status.compliance}
                  infra={status.infrastructure}
                  onEnforce={handleEnforcePuppet}
                  isRunning={isRunning}
                />
                <AnsibleStep
                  deployment={status.deployment}
                  infra={status.infrastructure}
                  stack={status.stack}
                  customCode={status.custom_code}
                  onDeploy={handleDeployAnsible}
                  isRunning={isRunning}
                  onRefreshStatus={() => fetchStatus().then(setStatus)}
                />
                <NagiosStep
                  telemetry={status.telemetry}
                  infra={status.infrastructure}
                  onProbe={handleProbeNagios}
                  isRunning={isRunning}
                />
              </div>

              {/* Live Terminal */}
              <Terminal logs={logs} onClear={handleClearLogs} />
            </div>
          )}

          {/* SECTION 0: PRE-DEPLOYMENT PROJECT READINESS DEDICATED VIEW */}
          {activeTab === 'preflight' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <ShieldCheck size={18} color="var(--aws-orange)" />
                    <span>0. Pre-Deployment Readiness Checklist</span>
                  </div>
                  <div className="section-banner-sub">
                    Verify manifests, host binding, and health route before deploy.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <PreDeploymentChecklist
                  backendType={status.stack?.backend?.type || 'python'}
                  frontendType={status.stack?.frontend?.type || 'react'}
                  isInfraReady={status.infrastructure.status === 'ready'}
                  hasCustomCode={!!(status.custom_code?.backend || status.custom_code?.frontend)}
                  customCode={status.custom_code}
                  onProceed={() => handleSelectTab('tf')}
                  proceedLabel="Proceed to Step 1: Terraform IaC"
                  defaultOpen={true}
                  titlePrefix="Project Readiness:"
                />
                <Terminal logs={logs} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 2: TERRAFORM IAC FOCUSED VIEW */}
          {activeTab === 'tf' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <Layers size={18} color="var(--accent-terraform)" />
                    <span>Step 1: Terraform IaC</span>
                  </div>
                  <div className="section-banner-sub">
                    AWS VPC, Subnets, Security Groups & EC2 provisioning.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Pre-Deployment Readiness Check (Before Starting Step 1) */}
                <PreDeploymentChecklist
                  backendType={status.stack?.backend?.type || 'python'}
                  frontendType={status.stack?.frontend?.type || 'react'}
                  isInfraReady={status.infrastructure.status === 'ready'}
                  hasCustomCode={!!(status.custom_code?.backend || status.custom_code?.frontend)}
                  customCode={status.custom_code}
                  titlePrefix="Step 1 Prerequisite:"
                  defaultOpen={false}
                />

                <TerraformStep
                  infra={status.infrastructure}
                  onApply={handleApplyTerraform}
                  onDestroy={handleDestroyTerraform}
                  isRunning={isRunning}
                />
                <Terminal logs={logs.filter(l => l.stage === 'TERRAFORM' || l.stage === 'SYSTEM')} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 3: ANSIBLE FULL-STACK DEPLOYMENT FOCUSED VIEW */}
          {activeTab === 'ans' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <Package size={18} color="var(--accent-ansible)" />
                    <span>Step 2: Ansible Deployment</span>
                  </div>
                  <div className="section-banner-sub">
                    Polyglot 3-tier application stack & Nginx reverse proxy.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <AnsibleStep
                  deployment={status.deployment}
                  infra={status.infrastructure}
                  stack={status.stack}
                  customCode={status.custom_code}
                  onDeploy={handleDeployAnsible}
                  isRunning={isRunning}
                  onRefreshStatus={() => fetchStatus().then(setStatus)}
                />
                <Terminal logs={logs.filter(l => l.stage === 'ANSIBLE' || l.stage === 'SYSTEM')} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 4: PUPPET COMPLIANCE FOCUSED VIEW */}
          {activeTab === 'pup' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <ShieldCheck size={18} color="var(--accent-puppet)" />
                    <span>Step 3: Puppet Compliance</span>
                  </div>
                  <div className="section-banner-sub">
                    Configuration baseline, SSH hardening, and drift self-healing.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <PuppetStep
                  compliance={status.compliance}
                  infra={status.infrastructure}
                  onEnforce={handleEnforcePuppet}
                  isRunning={isRunning}
                />
                <Terminal logs={logs.filter(l => l.stage === 'PUPPET' || l.stage === 'SYSTEM')} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 5: NAGIOS OBSERVABILITY FOCUSED VIEW */}
          {activeTab === 'nag' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <Activity size={18} color="var(--accent-nagios)" />
                    <span>Step 4: Nagios Observability</span>
                  </div>
                  <div className="section-banner-sub">
                    Active HTTP port 80 health checks, backend API latency, and host load.
                  </div>
                </div>
              </div>

              {/* Real-time Hardware Charts inside Monitoring */}
              <MetricCharts telemetry={status.telemetry} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <NagiosStep
                  telemetry={status.telemetry}
                  infra={status.infrastructure}
                  onProbe={handleProbeNagios}
                  isRunning={isRunning}
                />
                <Terminal logs={logs.filter(l => l.stage === 'NAGIOS' || l.stage === 'CHAOS')} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 6: CHAOS LAB FOCUSED VIEW */}
          {activeTab === 'chaos' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <Flame size={18} color="var(--status-danger)" />
                    <span>Chaos Engineering Lab</span>
                  </div>
                  <div className="section-banner-sub">
                    Failure simulation and automated self-healing verification.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ChaosPanel
                  chaos={status.chaos}
                  infra={status.infrastructure}
                  onInject={handleInjectChaos}
                  onHeal={handleHealChaos}
                  isRunning={isRunning}
                />
                <NagiosStep
                  telemetry={status.telemetry}
                  infra={status.infrastructure}
                  onProbe={handleProbeNagios}
                  isRunning={isRunning}
                />
                <Terminal logs={logs.filter(l => l.stage === 'CHAOS' || l.stage === 'NAGIOS' || l.stage === 'PUPPET')} onClear={handleClearLogs} />
              </div>
            </div>
          )}

          {/* SECTION 7: LIVE TERMINAL FULL CONSOLE VIEW */}
          {activeTab === 'term' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <TerminalIcon size={18} color="var(--aws-orange)" />
                    <span>DevOps Live Terminal</span>
                  </div>
                  <div className="section-banner-sub">
                    Real-time WebSocket streaming logs from Terraform, Ansible, Puppet, and Nagios.
                  </div>
                </div>
              </div>

              <Terminal logs={logs} onClear={handleClearLogs} fullHeight={true} />
            </div>
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => {
          if (isLiveModeRequired) {
            setModeAlert({
              title: 'Live Mode Switch Cancelled',
              message: 'Platform remains in SIMULATION MODE. Provide your AWS credentials whenever you are ready to switch.',
              type: 'info'
            });
          }
          setIsConfigOpen(false);
          setIsLiveModeRequired(false);
        }}
        isLiveModeRequired={isLiveModeRequired}
        onSuccess={async () => {
          if (isLiveModeRequired) {
            try {
              await setExecutionMode('live');
              const updated = await fetchStatus();
              setStatus(updated);
              setIsLiveModeRequired(false);
              setModeAlert({
                title: 'Live AWS Cloud Mode Activated',
                message: 'AWS credentials saved. Platform successfully switched to LIVE MODE in Region ap-south-1.',
                type: 'success'
              });
            } catch (err: any) {
              console.error('Failed to activate live mode after credential save', err);
              setModeAlert({
                title: 'Live Mode Activation Failed',
                message: err.message || 'Could not switch to Live Mode.',
                type: 'error'
              });
            }
          }
        }}
      />
      <VivaModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />

      {/* Floating On-Screen Mode Switch Alert Toast */}
      {modeAlert && (
        <aside
          className="mode-alert-card"
          role="alert"
          aria-live="assertive"
          style={{
            position: 'fixed',
            top: '70px',
            right: '24px',
            width: '430px',
            maxWidth: 'calc(100vw - 48px)',
            background: 'var(--bg-card)',
            border: `1.5px solid ${
              modeAlert.type === 'warning' || modeAlert.type === 'error'
                ? 'var(--aws-orange)'
                : modeAlert.type === 'success'
                ? 'var(--status-success)'
                : 'var(--aws-blue)'
            }`,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            padding: '1.15rem',
            zIndex: 10000,
            animation: 'slideInDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: modeAlert.type === 'warning' || modeAlert.type === 'error'
                ? 'var(--aws-orange)'
                : modeAlert.type === 'success'
                ? 'var(--status-success)'
                : 'var(--aws-blue)',
              background: modeAlert.type === 'warning' || modeAlert.type === 'error'
                ? 'rgba(236, 114, 17, 0.12)'
                : modeAlert.type === 'success'
                ? 'rgba(22, 163, 74, 0.12)'
                : 'rgba(9, 114, 211, 0.12)',
              padding: '0.2rem 0.55rem',
              borderRadius: '4px',
              border: `1px solid ${
                modeAlert.type === 'warning' || modeAlert.type === 'error'
                  ? 'rgba(236, 114, 17, 0.3)'
                  : modeAlert.type === 'success'
                  ? 'rgba(22, 163, 74, 0.3)'
                  : 'rgba(9, 114, 211, 0.3)'
              }`,
              letterSpacing: '0.04em'
            }}>
              <AlertTriangle size={13} />
              <span>{modeAlert.type === 'warning' || modeAlert.type === 'error' ? 'MODE SWITCH BLOCKED' : 'SYSTEM NOTICE'}</span>
            </div>
            <button
              type="button"
              onClick={() => setModeAlert(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '2px' }}
              title="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
            {modeAlert.title}
          </div>

          <p style={{ fontSize: '0.81rem', color: 'var(--text-muted)', lineHeight: 1.45, margin: '0 0 0.85rem 0' }}>
            {modeAlert.message}
          </p>

          {(modeAlert.type === 'warning' || modeAlert.type === 'error') && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setModeAlert(null)}
                style={{ height: '30px', fontSize: '0.76rem', padding: '0 0.75rem' }}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setModeAlert(null);
                  setIsLiveModeRequired(true);
                  setIsConfigOpen(true);
                }}
                style={{ height: '30px', fontSize: '0.76rem', padding: '0 0.85rem' }}
              >
                <Key size={13} />
                <span>Configure AWS Credentials</span>
              </button>
            </div>
          )}
        </aside>
      )}

      {/* Floating On-Screen Step Completion Notification */}
      <StepCompletionNotification
        data={completionNotice}
        onClose={() => setCompletionNotice(null)}
        onProceed={handleSelectTab}
      />
    </div>
  );
}

export default App;
