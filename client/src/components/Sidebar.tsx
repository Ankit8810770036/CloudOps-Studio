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
  Network,
  HelpCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FullStatus } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenConfig: () => void;
  onOpenArch: () => void;
  onOpenViva: () => void;
  status: FullStatus;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeTab,
  onSelectTab,
  onOpenConfig,
  onOpenArch,
  onOpenViva,
  status,
}) => {
  const isHealthy = status.telemetry.overall_health === 'HEALTHY';
  const isCritical = status.telemetry.overall_health === 'CRITICAL';

  const navItems = [
    { id: 'all', label: 'Console Overview', icon: LayoutDashboard },
    { id: 'tf', label: '1. Terraform IaC', icon: Layers },
    { id: 'ans', label: '2. Full-Stack Deploy', icon: Package },
    { id: 'pup', label: '3. Puppet Baseline', icon: ShieldCheck },
    { id: 'nag', label: '4. Nagios Telemetry', icon: Activity },
    { id: 'chaos', label: 'Chaos Lab', icon: Flame },
    { id: 'term', label: 'Live Terminal', icon: Terminal },
  ];

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* 1. Brand Header */}
      <div className="sidebar-brand">
        {collapsed ? (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            style={{ width: 38, height: 38 }}
          >
            <ChevronRight size={18} color="var(--aws-orange)" />
          </button>
        ) : (
          <>
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
            <button
              type="button"
              className="sidebar-collapse-btn"
              onClick={onToggleCollapse}
              title="Collapse sidebar"
            >
              <ChevronLeft size={16} />
            </button>
          </>
        )}
      </div>

      {/* 2. Navigation Links */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-title">
          {!collapsed && <span>DEPLOYMENT WORKFLOW</span>}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={17} className="sidebar-nav-icon" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'nag' && (
                <span className={`sidebar-pill ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`}>
                  {status.telemetry.overall_health}
                </span>
              )}
            </button>
          );
        })}

        <div className="sidebar-section-title" style={{ marginTop: '0.85rem' }}>
          {!collapsed && <span>RESOURCES & DOCS</span>}
        </div>

        <button
          className="sidebar-nav-item"
          onClick={onOpenArch}
          title={collapsed ? "Architecture Blueprint" : undefined}
        >
          <Network size={17} className="sidebar-nav-icon" />
          {!collapsed && <span>Architecture Blueprint</span>}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onOpenViva}
          title={collapsed ? "DevOps Viva Q&A Guide" : undefined}
        >
          <HelpCircle size={17} className="sidebar-nav-icon" />
          {!collapsed && <span>Viva & Examiner Q&A</span>}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onOpenConfig}
          title={collapsed ? "AWS Credentials & Settings" : undefined}
        >
          <Settings size={17} className="sidebar-nav-icon" />
          {!collapsed && <span>AWS Cloud Settings</span>}
        </button>
      </nav>

      {/* 3. System Status Indicator Card */}
      {!collapsed ? (
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
      ) : (
        <div style={{ padding: '0.5rem', textAlign: 'center' }}>
          <span className={`status-dot ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`} title={`Health: ${status.telemetry.overall_health}`} />
        </div>
      )}

      {/* 4. Bottom Always-Visible Expand / Collapse Toggle Bar */}
      <button
        type="button"
        className="sidebar-bottom-toggle"
        onClick={onToggleCollapse}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight size={18} />
        ) : (
          <>
            <ChevronLeft size={16} />
            <span>Collapse Sidebar</span>
          </>
        )}
      </button>
    </aside>
  );
};
