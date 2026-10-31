import React, { useState } from 'react';
import {
  Search,
  Globe,
  Sun,
  Moon,
  RefreshCw,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { ExecutionMode, FullStatus } from '../types';

interface TopNavbarProps {
  mode: ExecutionMode;
  onToggleMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  status: FullStatus;
  selectedRegion: string;
  onSelectRegion: (reg: string) => void;
  onSearchFocus: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode,
  onToggleMode,
  theme,
  onToggleTheme,
  status,
  selectedRegion,
  onSelectRegion,
  onSearchFocus,
}) => {
  const [copied, setCopied] = useState(false);
  const isReady = status.infrastructure.status === 'ready';
  const isRunning = status.is_running_pipeline;

  const handleCopy = () => {
    if (status.infrastructure.public_ip) {
      navigator.clipboard.writeText(status.infrastructure.public_ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="top-navbar">
      {/* 1. Global Search Bar */}
      <div className="navbar-search-wrapper" onClick={onSearchFocus}>
        <Search size={14} color="var(--text-dim)" />
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search cloud resources, EC2, playbooks, logs..."
          readOnly
        />
        <span className="navbar-kbd-shortcut">Ctrl+K</span>
      </div>

      {/* 2. Controls & Actions */}
      <div className="navbar-actions">
        {/* Pipeline In-Progress Spinner */}
        {isRunning && (
          <div className="running-action-badge">
            <RefreshCw size={12} className="animate-spin" />
            <span>{status.current_action || 'Processing...'}</span>
          </div>
        )}

        {/* Global AWS Region Selector */}
        <div className="navbar-region-dropdown">
          <Globe size={14} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
          <select
            value={selectedRegion}
            onChange={(e) => onSelectRegion(e.target.value)}
            className="navbar-region-select"
            title="Global AWS Region"
          >
            <option value="us-east-1">us-east-1 (N. Virginia)</option>
            <option value="us-west-2">us-west-2 (Oregon)</option>
            <option value="eu-west-1">eu-west-1 (Ireland)</option>
            <option value="ap-south-1">ap-south-1 (Mumbai)</option>
          </select>
        </div>

        {/* Target Node Connection Pill */}
        {isReady && status.infrastructure.public_ip ? (
          <div className="navbar-node-pill">
            <span className="status-dot healthy" />
            <span style={{ fontFamily: "'JetBrains Mono', Consolas, monospace", fontWeight: 700 }}>
              {status.infrastructure.public_ip}
            </span>
            <button onClick={handleCopy} className="navbar-icon-btn" title="Copy Public IP">
              {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
            </button>
            {status.infrastructure.app_url && (
              <a
                href={status.infrastructure.app_url}
                target="_blank"
                rel="noreferrer"
                className="navbar-icon-btn"
                title="Open Deployed Website"
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        ) : (
          <div className="navbar-node-pill muted">
            <span className="status-dot pending" />
            <span>No Node Active</span>
          </div>
        )}

        {/* Mode Toggle (Simulation vs Live AWS) */}
        <button
          className="navbar-mode-btn"
          onClick={onToggleMode}
          title="Switch execution mode between Live AWS and Simulation"
        >
          <span className={`mode-indicator-dot ${mode}`} />
          <span>{mode.toUpperCase()} MODE</span>
        </button>

        {/* Theme Switcher (Light vs Dark) */}
        <button
          className="navbar-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun size={15} color="var(--aws-orange)" />
          ) : (
            <Moon size={15} color="var(--aws-blue)" />
          )}
        </button>
      </div>
    </header>
  );
};
