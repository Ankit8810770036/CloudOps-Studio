import React from 'react';
import { Activity, RefreshCw, CheckCircle, Server, Database, Globe, Cpu, HardDrive } from 'lucide-react';
import { CircularLoader } from './CircularLoader';
import { TelemetryState, InfrastructureState } from '../types';

interface NagiosStepProps {
  telemetry: TelemetryState;
  infra: InfrastructureState;
  onProbe: () => void;
  isRunning: boolean;
}

export const NagiosStep: React.FC<NagiosStepProps> = React.memo(({
  telemetry,
  infra,
  onProbe,
  isRunning,
}) => {
  const isInfraReady = infra.status === 'ready';
  const checks = telemetry.checks;
  const [isProbingLocally, setIsProbingLocally] = React.useState(false);
  const isStepRunning = isRunning || isProbingLocally;
  const [relativeTime, setRelativeTime] = React.useState<string>('');

  React.useEffect(() => {
    if (!isRunning) {
      setIsProbingLocally(false);
    }
  }, [isRunning]);

  React.useEffect(() => {
    const updateRelative = () => {
      if (!telemetry.last_check) {
        setRelativeTime('Pending Probe');
        return;
      }
      const now = new Date();
      const parts = telemetry.last_check.split(':');
      if (parts.length >= 3) {
        const checkTime = new Date();
        checkTime.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10), 0);
        let diffMs = now.getTime() - checkTime.getTime();
        if (diffMs < 0) {
          diffMs += 86400000;
        }
        const diffSec = Math.floor(diffMs / 1000);
        if (diffSec < 4) {
          setRelativeTime('Checked just now');
        } else if (diffSec < 60) {
          setRelativeTime(`Checked ${diffSec}s ago`);
        } else {
          setRelativeTime(`Checked ${Math.floor(diffSec / 60)}m ago`);
        }
      } else {
        setRelativeTime(`Checked at ${telemetry.last_check}`);
      }
    };

    updateRelative();
    const interval = setInterval(updateRelative, 1000);
    return () => clearInterval(interval);
  }, [telemetry.last_check]);

  const handleProbeClick = async () => {
    if (isStepRunning || !isInfraReady) return;
    setIsProbingLocally(true);
    try {
      await onProbe();
    } finally {
      setTimeout(() => setIsProbingLocally(false), 2500);
    }
  };

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
      <div>
        {/* Header */}
        <div className="panel-header">
          <h3>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: 'rgba(22, 163, 74, 0.12)',
              border: '1px solid rgba(22, 163, 74, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-nagios)',
              flexShrink: 0
            }}>
              <Activity size={14} />
            </div>
            <span>Step 4: Nagios Observability</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
              <span className={`status-dot ${telemetry.overall_health === 'HEALTHY' ? 'healthy pulse' : telemetry.overall_health === 'CRITICAL' ? 'critical' : 'pending'}`} />
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 500, fontFamily: 'monospace' }}>
                {relativeTime || 'Active'}
              </span>
            </div>
            <button
              className={`btn-secondary ${isStepRunning ? 'is-running' : ''}`}
              onClick={handleProbeClick}
              disabled={isStepRunning || !isInfraReady}
              style={{ padding: '0 0.65rem', fontSize: '0.76rem', height: '30px' }}
            >
              {isStepRunning ? (
                <>
                  <CircularLoader size={12} color="var(--accent-nagios)" />
                  <span>Probing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={12} />
                  <span>Probe Now</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 6 Multi-Tier Telemetry Gauges Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem', marginBottom: '0.85rem' }}>
          {/* 1. Frontend */}
          <div className="telemetry-gauge-card">
            <div className="metric-label-row">
              <span className="metric-name-group">
                <Globe size={13} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
                <span>Frontend (80)</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.http?.status),
                  background: getStatusBg(checks.http?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
                }}
              >
                {checks.http?.status === 'OK' ? `${checks.http?.response_time_ms}ms` : checks.http?.status || 'Unknown'}
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

          {/* 2. Backend */}
          <div className="telemetry-gauge-card">
            <div className="metric-label-row">
              <span className="metric-name-group">
                <Server size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
                <span>Backend API</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.backend_api?.status),
                  background: getStatusBg(checks.backend_api?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
                }}
              >
                {checks.backend_api?.status === 'OK' ? `${checks.backend_api?.latency_ms}ms` : checks.backend_api?.status || 'Active'}
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

          {/* 3. Database */}
          <div className="telemetry-gauge-card">
            <div className="metric-label-row">
              <span className="metric-name-group">
                <Database size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
                <span>Database</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.database?.status),
                  background: getStatusBg(checks.database?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
                }}
              >
                {checks.database?.status === 'OK' ? 'HEALTHY' : checks.database?.status || 'Active'}
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

          {/* 4. CPU */}
          <div className="telemetry-gauge-card">
            <div className="metric-label-row">
              <span className="metric-name-group">
                <Cpu size={13} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
                <span>CPU Load</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.cpu?.status),
                  background: getStatusBg(checks.cpu?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
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
                <Activity size={13} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
                <span>RAM Memory</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.memory?.status),
                  background: getStatusBg(checks.memory?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
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

          {/* 6. Disk */}
          <div className="telemetry-gauge-card">
            <div className="metric-label-row">
              <span className="metric-name-group">
                <HardDrive size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
                <span>Disk Storage</span>
              </span>
              <span
                className="metric-status-val"
                style={{
                  color: getStatusColor(checks.disk?.status),
                  background: getStatusBg(checks.disk?.status),
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  fontSize: '0.74rem'
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
        <div>
          {(() => {
            const activeIncidents = telemetry.alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'WARNING');
            return (
              <>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Active Incidents ({activeIncidents.length})
                </span>
                <div className="alert-feed-container">
                  {activeIncidents.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0' }}>
                      <CheckCircle size={14} style={{ flexShrink: 0 }} />
                      <span><strong>All Clear:</strong> Frontend, Backend, and Database are operating normally.</span>
                    </div>
                  ) : (
                    activeIncidents.map((a) => (
                      <div
                        key={a.id}
                        style={{
                          fontSize: '0.78rem',
                          padding: '0.35rem 0.55rem',
                          borderRadius: '4px',
                          background: a.severity === 'CRITICAL' ? 'var(--status-danger-bg)' :
                                      a.severity === 'WARNING' ? 'var(--status-warning-bg)' : 'var(--status-success-bg)',
                          borderLeft: `3px solid ${a.severity === 'CRITICAL' ? 'var(--status-danger)' : a.severity === 'WARNING' ? 'var(--status-warning)' : 'var(--status-success)'}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '0.45rem'
                        }}
                      >
                        <div>
                          <strong style={{ color: a.severity === 'CRITICAL' ? 'var(--status-danger)' : a.severity === 'WARNING' ? 'var(--status-warning)' : 'var(--status-success)' }}>
                            [{a.severity}] {a.title}
                          </strong>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.05rem' }}>{a.description}</div>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace', flexShrink: 0 }}>{a.timestamp}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* Step 4 Completion Confirmation Banner */}
        {telemetry.overall_health === 'HEALTHY' && isInfraReady && Boolean(telemetry.last_check) && (
          <div className="step-success-banner" style={{ marginTop: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                  Step 4 Completed: Observability & Health Active
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Overall Status: <strong style={{ color: '#10B981' }}>HEALTHY (100% UP)</strong> • All active service probes passing
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
