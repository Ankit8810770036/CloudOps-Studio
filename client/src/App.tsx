import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { TopStats } from './components/TopStats';
import { TerraformStep } from './components/TerraformStep';
import { AnsibleStep } from './components/AnsibleStep';
import { PuppetStep } from './components/PuppetStep';
import { NagiosStep } from './components/NagiosStep';
import { ChaosPanel } from './components/ChaosPanel';
import { Terminal } from './components/Terminal';
import { ConfigModal } from './components/ConfigModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { VivaModal } from './components/VivaModal';

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
  const [activeStepTab, setActiveStepTab] = useState<'all' | 'tf' | 'ans' | 'pup' | 'nag'>('all');

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isArchOpen, setIsArchOpen] = useState(false);
  const [isVivaOpen, setIsVivaOpen] = useState(false);

  // Poll status periodically
  useEffect(() => {
    const update = () => {
      fetchStatus()
        .then(setStatus)
        .catch((err) => console.error('Status fetch error', err));
    };
    update();
    const interval = setInterval(update, 2500);
    return () => clearInterval(interval);
  }, []);

  // Connect WebSocket for real-time streaming terminal logs
  useEffect(() => {
    const ws = connectLogWebSocket((entry) => {
      setLogs((prev) => [...prev, entry]);
    });
    return () => {
      ws.close();
    };
  }, []);

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

  const handleDeployAnsible = async (webServer: 'nginx' | 'apache') => {
    await deployAnsible(webServer);
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
        background: '#0a0e17',
        color: '#f8fafc'
      }}>
        <div className="brand-icon" style={{ animation: 'spin 3s linear infinite' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #38bdf8', borderTopColor: 'transparent', borderRadius: '50%' }}></div>
        </div>
        <p style={{ fontSize: '0.95rem', color: '#94a3b8' }}>Connecting to CloudOps Orchestrator (Port 8000)...</p>
      </div>
    );
  }

  const isRunning = status.is_running_pipeline;

  return (
    <>
      <div className="glow-orb-1"></div>
      <div className="glow-orb-2"></div>

      <div className="layout-wrapper">
        <Header
          mode={status.mode}
          onToggleMode={handleToggleMode}
          onOpenConfig={() => setIsConfigOpen(true)}
          onOpenArch={() => setIsArchOpen(true)}
          onOpenViva={() => setIsVivaOpen(true)}
          isRunning={isRunning}
          currentAction={status.current_action}
        />

        <TopStats status={status} />

        {/* Stepper Navigation Filter */}
        <div className="stepper-nav">
          <button
            className={`step-tab ${activeStepTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveStepTab('all')}
          >
            <div className="step-num" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>★</div>
            <div className="step-info">
              <h4>All 4 Stages</h4>
              <p>Full Pipeline Overview</p>
            </div>
          </button>

          <button
            className={`step-tab ${activeStepTab === 'tf' ? 'active' : ''}`}
            onClick={() => setActiveStepTab('tf')}
          >
            <div className="step-num" style={{ background: 'rgba(132, 79, 186, 0.2)', color: '#c084fc' }}>1</div>
            <div className="step-info">
              <h4>Terraform IaC</h4>
              <p>Cloud Server Provisioning</p>
            </div>
          </button>

          <button
            className={`step-tab ${activeStepTab === 'ans' ? 'active' : ''}`}
            onClick={() => setActiveStepTab('ans')}
          >
            <div className="step-num" style={{ background: 'rgba(238, 0, 0, 0.2)', color: '#f87171' }}>2</div>
            <div className="step-info">
              <h4>Ansible Deploy</h4>
              <p>Web Server & Application</p>
            </div>
          </button>

          <button
            className={`step-tab ${activeStepTab === 'pup' ? 'active' : ''}`}
            onClick={() => setActiveStepTab('pup')}
          >
            <div className="step-num" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>3</div>
            <div className="step-info">
              <h4>Puppet & Nagios</h4>
              <p>Compliance & Health Monitoring</p>
            </div>
          </button>
        </div>

        {/* Chaos Engineering Failure Simulator Banner */}
        <ChaosPanel
          chaos={status.chaos}
          infra={status.infrastructure}
          onInject={handleInjectChaos}
          onHeal={handleHealChaos}
          isRunning={isRunning}
        />

        {/* 4 Pipeline Stages in Grid or Filtered View */}
        <div className="main-grid">
          {(activeStepTab === 'all' || activeStepTab === 'tf') && (
            <TerraformStep
              infra={status.infrastructure}
              onApply={handleApplyTerraform}
              onDestroy={handleDestroyTerraform}
              isRunning={isRunning}
            />
          )}

          {(activeStepTab === 'all' || activeStepTab === 'ans') && (
            <AnsibleStep
              deployment={status.deployment}
              infra={status.infrastructure}
              onDeploy={handleDeployAnsible}
              isRunning={isRunning}
            />
          )}

          {(activeStepTab === 'all' || activeStepTab === 'pup') && (
            <PuppetStep
              compliance={status.compliance}
              infra={status.infrastructure}
              onEnforce={handleEnforcePuppet}
              isRunning={isRunning}
            />
          )}

          {(activeStepTab === 'all' || activeStepTab === 'pup' || activeStepTab === 'nag') && (
            <NagiosStep
              telemetry={status.telemetry}
              infra={status.infrastructure}
              onProbe={handleProbeNagios}
              isRunning={isRunning}
            />
          )}
        </div>

        {/* Real-time Streaming Terminal */}
        <Terminal logs={logs} onClear={handleClearLogs} />
      </div>

      {/* Modals */}
      <ConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
      <ArchitectureModal isOpen={isArchOpen} onClose={() => setIsArchOpen(false)} />
      <VivaModal isOpen={isVivaOpen} onClose={() => setIsVivaOpen(false)} />
    </>
  );
}

export default App;
