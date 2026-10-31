import React from 'react';
import { Server, Globe, ShieldCheck, Activity, ExternalLink, Copy, Check } from 'lucide-react';
import { FullStatus } from '../types';

interface TopStatsProps {
  status: FullStatus;
}

export const TopStats: React.FC<TopStatsProps> = ({ status }) => {
  const [copied, setCopied] = React.useState(false);
  const ip = status.infrastructure.public_ip || 'Not Provisioned';
  const isReady = status.infrastructure.status === 'ready';
  const isDeployed = status.deployment.status === 'deployed';
  const isHealthy = status.telemetry.overall_health === 'HEALTHY';
  const isCritical = status.telemetry.overall_health === 'CRITICAL';

  const handleCopyIp = () => {
    if (status.infrastructure.public_ip) {
      navigator.clipboard.writeText(status.infrastructure.public_ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="top-stats-grid">
      {/* 1. Target Server IP */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Target Cloud Host</span>
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Server size={16} />
          </div>
        </div>
        <div className="stat-main" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.15rem' }}>
          <span>{ip}</span>
          {isReady && (
            <button
              onClick={handleCopyIp}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              title="Copy IP"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            </button>
          )}
        </div>
        <div className="stat-desc">
          {isReady ? (
            <>
              <span className="pulse-green"></span>
              <span style={{ color: '#34d399' }}>EC2 Active ({status.infrastructure.instance_id || 'i-094b81c2'})</span>
            </>
          ) : (
            <span style={{ color: '#94a3b8' }}>Awaiting Terraform Provision</span>
          )}
        </div>
      </div>

      {/* 2. Web Application Status */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Web Application</span>
          <div className="stat-icon" style={{ background: 'rgba(238, 0, 0, 0.15)', color: '#f87171' }}>
            <Globe size={16} />
          </div>
        </div>
        <div className="stat-main" style={{ fontSize: '1.15rem' }}>
          {isDeployed ? `${status.deployment.web_server.toUpperCase()} Active` : 'Not Deployed'}
        </div>
        <div className="stat-desc">
          {isDeployed && status.infrastructure.app_url ? (
            <a
              href={status.infrastructure.app_url}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}
            >
              <span>Open Web App</span>
              <ExternalLink size={12} />
            </a>
          ) : (
            <span style={{ color: '#94a3b8' }}>Trigger via Ansible Playbook</span>
          )}
        </div>
      </div>

      {/* 3. Puppet Compliance Status */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Config Compliance</span>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="stat-main" style={{ fontSize: '1.15rem' }}>
          {status.compliance.status === 'compliant' ? '100% Compliant' :
           status.compliance.status === 'drift_detected' ? 'Drift Detected!' : 'Pending Enforce'}
        </div>
        <div className="stat-desc">
          <span style={{ color: status.compliance.drift_count === 0 ? '#34d399' : '#f87171' }}>
            {status.compliance.drift_count} Configuration Drifts
          </span>
        </div>
      </div>

      {/* 4. Nagios Health Monitor */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Nagios Health State</span>
          <div className="stat-icon" style={{
            background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: isCritical ? '#f87171' : '#34d399'
          }}>
            <Activity size={16} />
          </div>
        </div>
        <div className="stat-main" style={{ fontSize: '1.15rem', color: isCritical ? '#f87171' : isHealthy ? '#34d399' : '#fbbf24' }}>
          {status.telemetry.overall_health}
        </div>
        <div className="stat-desc">
          {isCritical ? (
            <>
              <span className="pulse-red"></span>
              <span style={{ color: '#f87171' }}>{status.telemetry.alerts.length} Alert(s) Firing!</span>
            </>
          ) : (
            <>
              <span className="pulse-green"></span>
              <span style={{ color: '#34d399' }}>All Service Probes Normal</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

