import React, { useState, useEffect } from 'react';
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
import { ArchitectureModal } from './components/ArchitectureModal';
import { VivaModal } from './components/VivaModal';
import { SearchModal } from './components/SearchModal';

import {
  fetchStatus,
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
import { Layers, Package, ShieldCheck, Activity, Flame, Terminal as TerminalIcon, LayoutDashboard } from 'lucide-react';

export function App() {
  const [status, setStatus] = useState<FullStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');

  // Theme: 'dark' (Enterprise NOC) or 'light' (Clean Dev Studio)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('cloudops_theme') as 'dark' | 'light') || 'dark';
  });

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isVivaOpen, setIsVivaOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cloudops_theme', theme);
  }, [theme]);

  // Keyboard shortcut Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Connect WebSocket for streaming terminal logs
  useEffect(() => {
    const ws = connectLogWebSocket((entry) => {
      setLogs(prev => [...prev, entry]);
    });
    return () => {
      ws.close();
    };
  }, []);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleMode = async () => {
    if (!status) return;
    const newMode = status.mode === 'simulation' ? 'live' : 'simulation';
    await setExecutionMode(newMode);
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleApplyTerraform = async (region: string, instanceType: string) => {
    await applyTerraform(region, instanceType);
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleDestroyTerraform = async () => {
    await destroyTerraform();
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleDeployAnsible = async (webServer: 'nginx' | 'apache', frontend: string, backend: string, database: string) => {
    await deployAnsible(webServer, frontend, backend, database);
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleEnforcePuppet = async () => {
    await enforcePuppet();
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleProbeNagios = async () => {
    await probeNagios();
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleInjectChaos = async (faultType: string) => {
    await injectChaos(faultType);
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleHealChaos = async () => {
    await healChaos();
    const updated = await fetchStatus();
    setStatus(updated);
  };

  const handleClearLogs = async () => {
    await clearLogs();
    setLogs([]);
  };

  if (!status) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '1rem',
        background: 'var(--bg-global)',
        color: 'var(--text-primary)'
      }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 8,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: 20, height: 20, border: '2.5px solid var(--aws-orange)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-dim)', fontWeight: 600 }}>Connecting to CloudOps Orchestrator...</p>
      </div>
    );
  }

  const isRunning = status.is_running_pipeline;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* 1. Left-Hand Collapsible Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenArch={() => setIsArchOpen(true)}
        onOpenViva={() => setIsVivaOpen(true)}
        status={status}
      />

      {/* 2. Main Wrapper */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <TopNavbar
          mode={status.mode}
          onToggleMode={handleToggleMode}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          status={status}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          onSearchFocus={() => setIsSearchOpen(true)}
        />

        {/* Main Content Area */}
        <main className="content-container">
          {/* SECTION 1: CONSOLE OVERVIEW (ALL) */}
          {activeTab === 'all' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <LayoutDashboard size={20} color="var(--aws-orange)" />
                    <span>Console Overview</span>
                  </div>
                  <div className="section-banner-sub">
                    Automated cloud infrastructure, polyglot application deployment, configuration baseline, and observability dashboard.
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

              {/* 4 Pipeline Steps Grid */}
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
                  onDeploy={handleDeployAnsible}
                  isRunning={isRunning}
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

          {/* SECTION 2: TERRAFORM IAC FOCUSED VIEW */}
          {activeTab === 'tf' && (
            <div>
              <div className="section-banner-header">
                <div>
                  <div className="section-banner-title">
                    <Layers size={20} color="var(--accent-terraform)" />
                    <span>Step 1: Terraform Infrastructure as Code (IaC)</span>
                  </div>
                  <div className="section-banner-sub">
                    Declarative provisioning of AWS VPC, Internet Gateway, Subnets, Security Groups, and EC2 compute instance.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    <Package size={20} color="var(--accent-ansible)" />
                    <span>Step 2: Full-Stack Polyglot Application Deployment (Ansible)</span>
                  </div>
                  <div className="section-banner-sub">
                    Idempotent configuration management for 3-tier architectures (Frontend, Backend API, Database) and Nginx reverse proxy.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <AnsibleStep
                  deployment={status.deployment}
                  infra={status.infrastructure}
                  stack={status.stack}
                  onDeploy={handleDeployAnsible}
                  isRunning={isRunning}
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
                    <ShieldCheck size={20} color="var(--accent-puppet)" />
                    <span>Step 3: Configuration Baseline & Self-Healing (Puppet)</span>
                  </div>
                  <div className="section-banner-sub">
                    Continuous desired-state enforcement, SSH hardening, database localhost isolation, and automatic drift remediation.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    <Activity size={20} color="var(--accent-nagios)" />
                    <span>Step 4: Observability & Proactive Monitoring (Nagios Core & NRPE)</span>
                  </div>
                  <div className="section-banner-sub">
                    Active HTTP port 80 health checks, backend API latency probes, database socket checks, and Linux load monitoring.
                  </div>
                </div>
              </div>

              {/* Real-time Hardware Charts right inside Monitoring */}
              <MetricCharts telemetry={status.telemetry} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    <Flame size={20} color="var(--status-danger)" />
                    <span>Chaos Engineering Lab & Automated Self-Healing Verification</span>
                  </div>
                  <div className="section-banner-sub">
                    Inject real or simulated outages into frontend, backend, or database tiers to test Nagios alert triggers and Puppet/Ansible remediation.
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
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
                    <TerminalIcon size={20} color="var(--aws-orange)" />
                    <span>DevOps Orchestrator Live Terminal</span>
                  </div>
                  <div className="section-banner-sub">
                    Real-time WebSocket streaming logs from Terraform, Ansible, Puppet, and Nagios runtime execution engines.
                  </div>
                </div>
              </div>

              <Terminal logs={logs} onClear={handleClearLogs} fullHeight={true} />
            </div>
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />
      <VivaModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={setActiveTab}
        onOpenConfig={() => setIsConfigOpen(true)}
        onOpenArch={() => setIsArchOpen(true)}
        onOpenViva={() => setIsVivaOpen(true)}
      />
    </div>
  );
}

export default App;
