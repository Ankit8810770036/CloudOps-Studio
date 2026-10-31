import React, { useState } from 'react';
import { Server, Layers, ShieldCheck, Activity, ExternalLink, Copy, Check, Database, Globe } from 'lucide-react';
import { FullStatus } from '../types';

interface TopStatsProps {
  status: FullStatus;
}

export const TopStats: React.FC<TopStatsProps> = ({ status }) => {
  const [copied, setCopied] = useState(false);
  const ip = status.infrastructure.public_ip || 'Not Provisioned';
  const isReady = status.infrastructure.status === 'ready';
  const isDeployed = status.deployment.status === 'deployed';
  const isHealthy = status.telemetry.overall_health === 'HEALTHY';
  const isCritical = status.telemetry.overall_health === 'CRITICAL';

  const backendName = status.stack?.backend?.type?.toUpperCase() || 'PYTHON';
  const dbName = status.stack?.database?.type?.toUpperCase() || 'POSTGRESQL';

  const handleCopyIp = () => {
    if (status.infrastructure.public_ip) {
      navigator.clipboard.writeText(status.infrastructure.public_ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="top-stats-grid">
      {/* 1. Target Compute Host (EC2) */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Cloud Compute Node</span>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 153, 0, 0.12)', color: '#FF9900' }}>
            <Server size={16} />
          </div>
        </div>
        <div className="stat-main">
          <span style={{ fontFamily: 'monospace' }}>{ip}</span>
          {isReady && (
            <button
              onClick={handleCopyIp}
              className="stat-copy-btn"
              title="Copy IP Address"
            >
              {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            </button>
          )}
        </div>
        <div className="stat-desc">
          {isReady ? (
            <>
              <span className="pulse-dot-green"></span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>
                AWS EC2 ({status.infrastructure.instance_id || 'i-094b81c2'})
              </span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Pending Terraform IaC Provision</span>
          )}
        </div>
      </div>

      {/* 2. Full-Stack Polyglot Topology */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Full-Stack Topology</span>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(0, 115, 187, 0.12)', color: '#0073BB' }}>
            <Layers size={16} />
          </div>
        </div>
        <div className="stat-main">
          {isDeployed ? (
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {status.deployment.web_server.toUpperCase()} + {backendName}
            </span>
          ) : (
            <span style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>Awaiting Ansible</span>
          )}
        </div>
        <div className="stat-desc">
          {isDeployed ? (
            <span style={{ color: '#0073BB', fontWeight: 600 }}>
              DB: {dbName} &bull; Reverse Proxy Port 80
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Configured in Step 2</span>
          )}
        </div>
      </div>

      {/* 3. Puppet Compliance & Drift */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Security & Compliance</span>
          <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
            <ShieldCheck size={16} />
          </div>
        </div>
        <div className="stat-main">
          {status.compliance.status === 'compliant' ? (
            <span style={{ color: '#10B981' }}>100% Compliant</span>
          ) : status.compliance.status === 'drift_detected' ? (
            <span style={{ color: '#EF4444' }}>Drift Detected!</span>
          ) : (
            <span>Pending Baseline</span>
          )}
        </div>
        <div className="stat-desc">
          <span style={{ color: status.compliance.drift_count === 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
            {status.compliance.drift_count} Security Violations &bull; Puppet
          </span>
        </div>
      </div>

      {/* 4. Nagios Health Monitor */}
      <div className="stat-card">
        <div className="stat-head">
          <span className="stat-title">Observability State</span>
          <div className="stat-icon-wrapper" style={{
            background: isCritical ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            color: isCritical ? '#EF4444' : '#10B981'
          }}>
            <Activity size={16} />
          </div>
        </div>
        <div className="stat-main" style={{ color: isCritical ? '#EF4444' : isHealthy ? '#10B981' : '#F59E0B' }}>
          {status.telemetry.overall_health}
        </div>
        <div className="stat-desc">
          {isCritical ? (
            <>
              <span className="pulse-dot-red"></span>
              <span style={{ color: '#EF4444', fontWeight: 600 }}>
                {status.telemetry.alerts.length} Incident Alert(s) Active!
              </span>
            </>
          ) : isHealthy ? (
            <>
              <span className="pulse-dot-green"></span>
              <span style={{ color: '#10B981', fontWeight: 600 }}>All 6 Multi-Tier Probes Passing</span>
            </>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>Probes Awaiting Server Boot</span>
          )}
        </div>
      </div>
    </div>
  );
};
