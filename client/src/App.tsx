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

export function App() {
  const [status, setStatus] = useState<FullStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [selectedRegion, setSelectedRegion] = useState<string>('us-east-1');

  // Theme: 'dark' (High-Performance NOC Console) or 'light' (Clean Dev Studio)
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
        background: '#0B0F19',
        color: '#F8FAFC'
      }}>
        <div style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: '#232F3E',
          border: '1px solid #FF9900',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ width: 22, height: 22, border: '3px solid #FF9900', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        </div>
        <p style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 600 }}>Connecting to CloudOps Orchestrator...</p>
      </div>
    );
  }

  const isRunning = status.is_running_pipeline;

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} data-theme={theme}>
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
          {/* Executive Metric Cards */}
          <TopStats status={status} />

          {/* Real-time Glowing SVG Telemetry Charts */}
          <MetricCharts telemetry={status.telemetry} />

          {/* Chaos Engineering Failure Simulator Panel */}
          {(activeTab === 'all' || activeTab === 'chaos') && (
            <ChaosPanel
              chaos={status.chaos}
              infra={status.infrastructure}
              onInject={handleInjectChaos}
              onHeal={handleHealChaos}
              isRunning={isRunning}
            />
          )}

          {/* Pipeline Workflow Grid */}
          <div className="main-grid">
            {(activeTab === 'all' || activeTab === 'tf') && (
              <TerraformStep
                infra={status.infrastructure}
                onApply={handleApplyTerraform}
                onDestroy={handleDestroyTerraform}
                isRunning={isRunning}
              />
            )}

            {(activeTab === 'all' || activeTab === 'ans') && (
              <AnsibleStep
                deployment={status.deployment}
                infra={status.infrastructure}
                stack={status.stack}
                onDeploy={handleDeployAnsible}
                isRunning={isRunning}
              />
            )}

            {(activeTab === 'all' || activeTab === 'pup') && (
              <PuppetStep
                compliance={status.compliance}
                infra={status.infrastructure}
                onEnforce={handleEnforcePuppet}
                isRunning={isRunning}
              />
            )}

            {(activeTab === 'all' || activeTab === 'nag') && (
              <NagiosStep
                telemetry={status.telemetry}
                infra={status.infrastructure}
                onProbe={handleProbeNagios}
                isRunning={isRunning}
              />
            )}
          </div>

          {/* Real-time Streaming Terminal */}
          {(activeTab === 'all' || activeTab === 'term') && (
            <Terminal logs={logs} onClear={handleClearLogs} />
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
