import React from 'react';
import { Activity, RefreshCw, CheckCircle, Server, Database, Globe, Cpu, HardDrive } from 'lucide-react';
import { TelemetryState, InfrastructureState } from '../types';

interface NagiosStepProps {
  telemetry: TelemetryState;
  infra: InfrastructureState;
  onProbe: () => void;
  isRunning: boolean;
}

export const NagiosStep: React.FC<NagiosStepProps> = ({
  telemetry,
  infra,
  onProbe,
  isRunning,
}) => {
  const isInfraReady = infra.status === 'ready';
  const checks = telemetry.checks;

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'OK': return 'var(--status-success)';
      case 'WARNING': return 'var(--status-warning)';
      case 'CRITICAL': return 'var(--status-danger)';
      case 'DISABLED': return 'var(--text-dim)';
      default: return 'var(--text-dim)';
    }
  };

  const getStatusBg = (status: string | undefined) => {
    switch (status) {
      case 'OK': return 'var(--status-success-bg)';
      case 'WARNING': return 'var(--status-warning-bg)';
      case 'CRITICAL': return 'var(--status-danger-bg)';
      default: return 'rgba(148, 163, 184, 0.1)';
    }
  };

  return (
    <div className="panel-card" style={{ gridColumn: 'span 2' }}>
      {/* Header */}
      <div className="panel-header">
        <h3>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(22, 163, 74, 0.12)',
            border: '1px solid rgba(22, 163, 74, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-nagios)',
            flexShrink: 0
          }}>
            <Activity size={15} />
          </div>
          <span>Step 4: Nagios Multi-Tier Observability & Service Probes</span>
        </h3>
        <button
          className="btn-secondary"
          onClick={onProbe}
          disabled={isRunning || !isInfraReady}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', minHeight: '32px' }}
        >
          <RefreshCw size={13} />
          <span>Probe Now</span>
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.15rem' }}>
        Nagios Core and NRPE continuously probe all 3 application tiers (Frontend Port 80, Backend API, Database socket) alongside Linux hardware metrics (CPU, RAM, Disk).
      </p>

      {/* 6 Multi-Tier Telemetry Gauges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '0.85rem', marginBottom: '1.15rem' }}>
        {/* 1. Frontend Web Tier */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <Globe size={15} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
              <span>Frontend (Port 80)</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.http?.status),
                background: getStatusBg(checks.http?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.http?.status === 'OK' ? `200 OK (${checks.http?.response_time_ms}ms)` :
               checks.http?.status === 'CRITICAL' ? 'CRITICAL (Refused)' : checks.http?.status || 'Unknown'}
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: checks.http?.status === 'OK' ? '100%' : '25%',
                backgroundColor: getStatusColor(checks.http?.status)
              }}
            />
          </div>
        </div>

        {/* 2. Backend API Tier */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <Server size={15} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
              <span>{checks.backend_api?.name || 'Backend API Tier'}</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.backend_api?.status),
                background: getStatusBg(checks.backend_api?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.backend_api?.status === 'OK' ? `ONLINE (${checks.backend_api?.latency_ms}ms)` :
               checks.backend_api?.status === 'CRITICAL' ? 'CRITICAL (Down)' : checks.backend_api?.status || 'Active'}
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: checks.backend_api?.status === 'OK' ? '100%' : '25%',
                backgroundColor: getStatusColor(checks.backend_api?.status)
              }}
            />
          </div>
        </div>

        {/* 3. Database Tier */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <Database size={15} color="var(--status-success)" style={{ flexShrink: 0 }} />
              <span>{checks.database?.name || 'Database Tier'}</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.database?.status),
                background: getStatusBg(checks.database?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.database?.status === 'OK' ? `HEALTHY (Port ${checks.database?.port || 5432})` :
               checks.database?.status === 'CRITICAL' ? 'CRITICAL (Down)' : checks.database?.status || 'Active'}
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: checks.database?.status === 'OK' ? '100%' : '25%',
                backgroundColor: getStatusColor(checks.database?.status)
              }}
            />
          </div>
        </div>

        {/* 4. CPU Utilization */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <Cpu size={15} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
              <span>CPU Utilization</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.cpu?.status),
                background: getStatusBg(checks.cpu?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.cpu?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.cpu?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.cpu?.status)
              }}
            />
          </div>
        </div>

        {/* 5. Memory */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <Activity size={15} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
              <span>RAM Memory</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.memory?.status),
                background: getStatusBg(checks.memory?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.memory?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.memory?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.memory?.status)
              }}
            />
          </div>
        </div>

        {/* 6. Disk Space */}
        <div className="telemetry-gauge-card">
          <div className="metric-label-row">
            <span className="metric-name-group">
              <HardDrive size={15} color="var(--status-success)" style={{ flexShrink: 0 }} />
              <span>Disk Storage (/)</span>
            </span>
            <span
              className="metric-status-val"
              style={{
                color: getStatusColor(checks.disk?.status),
                background: getStatusBg(checks.disk?.status),
                padding: '0.15rem 0.45rem',
                borderRadius: '4px'
              }}
            >
              {checks.disk?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg">
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.disk?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.disk?.status)
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Alerts List */}
      <div style={{ marginTop: 'auto' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Nagios Active Alerts & Incident Feed ({telemetry.alerts.length})
        </span>
        <div className="alert-feed-container">
          {telemetry.alerts.length === 0 ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.2rem' }}>
              <CheckCircle size={15} style={{ flexShrink: 0 }} />
              <span><strong>ALL CLEAR:</strong> All multi-tier checks normal. Frontend, Backend API, and Database are fully operational.</span>
            </div>
          ) : (
            telemetry.alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.65rem',
                  borderRadius: '4px',
                  background: a.severity === 'CRITICAL' ? 'var(--status-danger-bg)' :
                              a.severity === 'WARNING' ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
                  borderLeft: `3px solid ${a.severity === 'CRITICAL' ? 'var(--status-danger)' : a.severity === 'WARNING' ? 'var(--status-warning)' : 'var(--status-success)'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <strong style={{ color: a.severity === 'CRITICAL' ? 'var(--status-danger)' : a.severity === 'WARNING' ? 'var(--status-warning)' : 'var(--status-success)' }}>
                    [{a.severity}] {a.title}
                  </strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '0.1rem' }}>{a.description}</div>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'monospace', flexShrink: 0 }}>{a.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
