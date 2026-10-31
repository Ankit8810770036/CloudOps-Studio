import React from 'react';
import {
  Cloud,
  LayoutDashboard,
  Layers,
  Package,
  ShieldCheck,
  Activity,
  Flame,
  Terminal,
  HelpCircle,
  Settings,
  Check,
} from 'lucide-react';
import { FullStatus } from '../types';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenConfig: () => void;
  onOpenViva: () => void;
  status: FullStatus;
}

export const Sidebar: React.FC<SidebarProps> = React.memo(({
  activeTab,
  onSelectTab,
  onOpenConfig,
  onOpenViva,
  status,
}) => {
  const isHealthy = status.telemetry.overall_health === 'HEALTHY';
  const isCritical = status.telemetry.overall_health === 'CRITICAL';

  const isTfDone = status.infrastructure.status === 'ready';
  const isAnsDone = status.deployment.status === 'deployed';
  const isPupDone = status.compliance.status === 'compliant';
  const isNagDone = isHealthy && isAnsDone;

  const navItems = [
    { id: 'all', label: 'Console Overview', icon: LayoutDashboard },
    { id: 'tf', label: '1. Terraform IaC', icon: Layers, isComplete: isTfDone },
    { id: 'ans', label: '2. Full-Stack Deploy', icon: Package, isComplete: isAnsDone },
    { id: 'pup', label: '3. Puppet Baseline', icon: ShieldCheck, isComplete: isPupDone },
    { id: 'nag', label: '4. Nagios Telemetry', icon: Activity, isComplete: isNagDone },
    { id: 'chaos', label: 'Chaos Lab', icon: Flame },
    { id: 'term', label: 'Live Terminal', icon: Terminal },
  ];

  return (
    <aside className="sidebar-container">
      {/* 1. Brand Header */}
      <div className="sidebar-brand">
        <button
          type="button"
          className="brand-clickable-box"
          onClick={() => onSelectTab('all')}
          title="Return to Console Overview"
        >
          <div className="brand-logo-badge">
            <Cloud size={18} color="var(--aws-orange)" />
          </div>
          <div className="brand-text-block">
            <div className="brand-app-name">CloudOps Studio</div>
            <div className="brand-app-badge">AWS Cloud Console</div>
          </div>
        </button>
      </div>

      {/* 2. Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">
          <span>DEPLOYMENT WORKFLOW</span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
            >
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Icon size={17} className="sidebar-nav-icon" />
              </div>
              <span>{item.label}</span>
              {item.isComplete && (
                <span className="sidebar-step-check" title="Completed">
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
              {!item.isComplete && item.id === 'nag' && (
                <span className={`sidebar-pill ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`}>
                  {status.telemetry.overall_health}
                </span>
              )}
            </button>
          );
        })}

        <div className="sidebar-section-title" style={{ marginTop: '0.85rem' }}>
          <span>RESOURCES & DOCS</span>
        </div>

        <button
          className="sidebar-nav-item"
          onClick={onOpenViva}
          title="DevOps Viva Q&A Guide"
        >
          <HelpCircle size={17} className="sidebar-nav-icon" />
          <span>Viva & Examiner Q&A</span>
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onOpenConfig}
          title="AWS Credentials & Settings"
        >
          <Settings size={17} className="sidebar-nav-icon" />
          <span>AWS Cloud Settings</span>
        </button>
      </nav>

      {/* 3. System Status Indicator Card */}
      <div className="sidebar-footer-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
            System Health
          </span>
          <span className={`status-dot ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`} />
        </div>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
          {status.infrastructure.public_ip ? `Node: ${status.infrastructure.public_ip}` : 'Awaiting EC2 Provision'}
        </div>
        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
          Orchestrator Port 8000 Active
        </div>
      </div>
    </aside>
  );
});
