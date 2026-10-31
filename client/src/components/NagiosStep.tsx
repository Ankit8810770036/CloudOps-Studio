import React from 'react';
import { Activity, RefreshCw, CheckCircle, Server, Database, Globe } from 'lucide-react';
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
      case 'OK': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      case 'DISABLED': return '#64748b';
      default: return '#64748b';
    }
  };

  return (
    <div className="panel-card" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <h3>
          <Activity size={18} color="#34d399" />
          <span>Step 4: Nagios Multi-Tier Observability & Service Probes</span>
        </h3>
        <button
          className="btn-secondary"
          onClick={onProbe}
          disabled={isRunning || !isInfraReady}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
        >
          <RefreshCw size={13} />
          <span>Probe Now</span>
        </button>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
        Nagios Core and NRPE actively probe all 3 application tiers (Frontend Port 80, Backend API, Database daemon) alongside hardware health (CPU, RAM, Disk).
      </p>

      {/* 6 Multi-Tier Telemetry Gauges Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        {/* 1. Frontend Web Tier */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Globe size={13} color="#38bdf8" />
              <span>Frontend (Port 80)</span>
            </span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.http?.status) }}>
              {checks.http?.status === 'OK' ? `200 OK (${checks.http?.response_time_ms}ms)` :
               checks.http?.status === 'CRITICAL' ? 'CRITICAL (Refused)' : checks.http?.status || 'Unknown'}
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: checks.http?.status === 'OK' ? '100%' : '20%',
                backgroundColor: getStatusColor(checks.http?.status)
              }}
            ></div>
          </div>
        </div>

        {/* 2. Backend API Tier */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Server size={13} color="#f59e0b" />
              <span>{checks.backend_api?.name || 'Backend API Tier'}</span>
            </span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.backend_api?.status) }}>
              {checks.backend_api?.status === 'OK' ? `ONLINE (${checks.backend_api?.latency_ms}ms)` :
               checks.backend_api?.status === 'CRITICAL' ? 'CRITICAL (Down)' : checks.backend_api?.status || 'Active'}
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: checks.backend_api?.status === 'OK' ? '100%' : '20%',
                backgroundColor: getStatusColor(checks.backend_api?.status)
              }}
            ></div>
          </div>
        </div>

        {/* 3. Database Tier */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Database size={13} color="#10b981" />
              <span>{checks.database?.name || 'Database Tier'}</span>
            </span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.database?.status) }}>
              {checks.database?.status === 'OK' ? `HEALTHY (Port ${checks.database?.port || 5432})` :
               checks.database?.status === 'CRITICAL' ? 'CRITICAL (Unreachable)' : checks.database?.status || 'Active'}
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: checks.database?.status === 'OK' ? '100%' : '20%',
                backgroundColor: getStatusColor(checks.database?.status)
              }}
            ></div>
          </div>
        </div>

        {/* 4. CPU Utilization */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8' }}>CPU Utilization</span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.cpu?.status) }}>
              {checks.cpu?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.cpu?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.cpu?.status)
              }}
            ></div>
          </div>
        </div>

        {/* 5. Memory */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8' }}>RAM Memory</span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.memory?.status) }}>
              {checks.memory?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.memory?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.memory?.status)
              }}
            ></div>
          </div>
        </div>

        {/* 6. Disk Space */}
        <div className="metric-row" style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="metric-label-row">
            <span style={{ color: '#94a3b8' }}>Disk Storage (/)</span>
            <span style={{ fontWeight: 700, color: getStatusColor(checks.disk?.status) }}>
              {checks.disk?.value || 0}%
            </span>
          </div>
          <div className="metric-bar-bg" style={{ marginTop: '0.4rem' }}>
            <div
              className="metric-bar-fill"
              style={{
                width: `${Math.min(checks.disk?.value || 0, 100)}%`,
                backgroundColor: getStatusColor(checks.disk?.status)
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Active Alerts List */}
      <div style={{ marginTop: 'auto' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
          Nagios Active Alerts & Multi-Tier Incident Feed ({telemetry.alerts.length})
        </span>
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          maxHeight: '130px',
          overflowY: 'auto',
          padding: '0.5rem 0.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem'
        }}>
          {telemetry.alerts.length === 0 ? (
            <div style={{ fontSize: '0.8rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0' }}>
              <CheckCircle size={14} />
              <span>All multi-tier checks normal. Frontend, Backend API, and Database are operational.</span>
            </div>
          ) : (
            telemetry.alerts.map((a) => (
              <div
                key={a.id}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.5rem',
                  borderRadius: '6px',
                  background: a.severity === 'CRITICAL' ? 'rgba(239, 68, 68, 0.15)' :
                              a.severity === 'WARNING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                  borderLeft: `3px solid ${a.severity === 'CRITICAL' ? '#ef4444' : a.severity === 'WARNING' ? '#f59e0b' : '#10b981'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ color: a.severity === 'CRITICAL' ? '#f87171' : a.severity === 'WARNING' ? '#fbbf24' : '#34d399' }}>
                    [{a.severity}] {a.title}
                  </strong>
                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{a.description}</div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{a.timestamp}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
