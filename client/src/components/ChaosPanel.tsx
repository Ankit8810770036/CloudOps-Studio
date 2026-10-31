import React from 'react';
import { Flame, Server, Zap, Wrench, AlertOctagon, Cpu, Database, RefreshCw } from 'lucide-react';
import { ChaosState, InfrastructureState } from '../types';

interface ChaosPanelProps {
  chaos: ChaosState;
  infra: InfrastructureState;
  onInject: (faultType: string) => void;
  onHeal: () => void;
  isRunning: boolean;
}

export const ChaosPanel: React.FC<ChaosPanelProps> = ({
  chaos,
  infra,
  onInject,
  onHeal,
  isRunning,
}) => {
  const isInfraReady = infra.status === 'ready';
  const hasFault = Boolean(chaos.active_fault);

  return (
    <div className={`chaos-lab-container ${hasFault ? 'fault-active' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            background: hasFault ? 'var(--status-danger-bg)' : 'rgba(220, 38, 38, 0.12)',
            border: `1px solid ${hasFault ? 'var(--status-danger)' : 'rgba(220, 38, 38, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-danger)',
            flexShrink: 0
          }}>
            <Flame size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Chaos Engineering Lab
            </h4>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              Inject outages to test automated detection and self-healing.
            </p>
          </div>
        </div>

        {hasFault && (
          <button
            onClick={onHeal}
            disabled={isRunning}
            className="btn-primary"
            style={{
              background: 'var(--status-success)',
              border: '1px solid var(--status-success)',
              color: '#FFFFFF',
              height: '32px',
              fontSize: '0.78rem'
            }}
          >
            <Wrench size={13} />
            <span>Auto-Remediate</span>
          </button>
        )}
      </div>

      {/* Outage Alert Banner */}
      {hasFault && (
        <div className="chaos-banner">
          <AlertOctagon size={15} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          <span>
            <strong>ACTIVE OUTAGE:</strong> {chaos.description} &mdash; Click &quot;Auto-Remediate&quot; to restore baseline.
          </span>
        </div>
      )}

      {/* Fault Injection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.55rem' }}>
        <button
          onClick={() => onInject('http_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn"
        >
          <Zap size={13} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          <span>Crash Frontend (80)</span>
        </button>

        <button
          onClick={() => onInject('backend_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn"
        >
          <Server size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
          <span>Crash Backend API</span>
        </button>

        <button
          onClick={() => onInject('db_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn"
        >
          <Database size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
          <span>Crash Database</span>
        </button>

        <button
          onClick={() => onInject('cpu_spike')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn"
        >
          <Cpu size={13} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
          <span>CPU Spike (&gt;90%)</span>
        </button>

        <button
          onClick={() => onInject('config_tamper')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn"
        >
          <RefreshCw size={13} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
          <span>Drift (/etc/motd)</span>
        </button>
      </div>
    </div>
  );
};
