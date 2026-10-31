import React from 'react';
import { Cloud, Server, Settings, HelpCircle, Network, RefreshCw } from 'lucide-react';
import { ExecutionMode } from '../types';

interface HeaderProps {
  mode: ExecutionMode;
  onToggleMode: () => void;
  onOpenConfig: () => void;
  onOpenArch: () => void;
  onOpenViva: () => void;
  isRunning: boolean;
  currentAction: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onToggleMode,
  onOpenConfig,
  onOpenArch,
  onOpenViva,
  isRunning,
  currentAction,
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon">
          <Cloud size={28} color="#ffffff" />
        </div>
        <div>
          <h1 className="brand-title">CloudOps Studio</h1>
          <div className="brand-sub">
            <span>Automated Cloud Infrastructure & Configuration Platform</span>
            <span>&bull;</span>
            <span style={{ color: '#38bdf8' }}>AWS &bull; Terraform &bull; Ansible &bull; Puppet &bull; Nagios</span>
          </div>
        </div>
      </div>

      <div className="header-controls">
        {isRunning && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '0.4rem 0.8rem',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            color: '#38bdf8'
          }}>
            <RefreshCw size={14} className="animate-spin" />
            <span>{currentAction || 'Running Pipeline...'}</span>
          </div>
        )}

        {/* Execution Mode Toggle */}
        <button
          className="mode-toggle"
          onClick={onToggleMode}
          title="Switch between Live AWS execution and Interactive Simulation mode"
        >
          <span className={`mode-badge-dot ${mode}`}></span>
          <span>MODE: {mode.toUpperCase()}</span>
          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>(Click to switch)</span>
        </button>

        {/* Architecture Modal Button */}
        <button className="btn-secondary" onClick={onOpenArch}>
          <Network size={15} />
          <span>Architecture</span>
        </button>

        {/* Viva / Project Guide */}
        <button className="btn-secondary" onClick={onOpenViva}>
          <HelpCircle size={15} />
          <span>Viva Q&A Guide</span>
        </button>

        {/* AWS Settings Button */}
        <button className="btn-secondary" onClick={onOpenConfig}>
          <Settings size={15} />
          <span>AWS Settings</span>
        </button>
      </div>
    </header>
  );
};
