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
  Server,
  Database
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
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-badge">
          <Cloud size={20} color="#FF9900" />
        </div>
        {!collapsed && (
          <div className="brand-text-block">
            <div className="brand-app-name">CloudOps Studio</div>
            <div className="brand-app-badge">AWS Cloud Console</div>
          </div>
        )}
        <button
          className="sidebar-collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Links */}
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
              <Icon size={18} className="sidebar-nav-icon" />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.id === 'nag' && (
                <span className={`sidebar-pill ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`}>
                  {status.telemetry.overall_health}
                </span>
              )}
            </button>
          );
        })}

        <div className="sidebar-section-title" style={{ marginTop: '1.25rem' }}>
          {!collapsed && <span>RESOURCES & DOCS</span>}
        </div>

        <button
          className="sidebar-nav-item"
          onClick={onOpenArch}
          title={collapsed ? "Architecture Blueprint" : undefined}
        >
          <Network size={18} className="sidebar-nav-icon" />
          {!collapsed && <span>Architecture Blueprint</span>}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onOpenViva}
          title={collapsed ? "DevOps Viva Q&A Guide" : undefined}
        >
          <HelpCircle size={18} className="sidebar-nav-icon" />
          {!collapsed && <span>Viva & Examiner Q&A</span>}
        </button>

        <button
          className="sidebar-nav-item"
          onClick={onOpenConfig}
          title={collapsed ? "AWS Credentials & Settings" : undefined}
        >
          <Settings size={18} className="sidebar-nav-icon" />
          {!collapsed && <span>AWS Cloud Settings</span>}
        </button>
      </nav>

      {/* System Health Status Footer Card */}
      {!collapsed ? (
        <div className="sidebar-footer-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              System Health
            </span>
            <span className={`status-dot ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`}></span>
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {status.infrastructure.public_ip ? `Node: ${status.infrastructure.public_ip}` : 'Awaiting EC2 Provision'}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Port 8000 Orchestrator Active
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.75rem', textAlign: 'center' }}>
          <span className={`status-dot ${isCritical ? 'critical' : isHealthy ? 'healthy' : 'pending'}`}></span>
        </div>
      )}
    </aside>
  );
};

