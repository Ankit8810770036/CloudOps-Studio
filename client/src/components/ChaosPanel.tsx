import React from 'react';
import { Flame, ShieldAlert, Zap, Wrench, AlertOctagon, Cpu, Database, Server, RefreshCw } from 'lucide-react';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            background: hasFault ? 'var(--status-danger-bg)' : 'rgba(244, 63, 94, 0.16)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F43F5E',
            boxShadow: '0 2px 10px rgba(244, 63, 94, 0.25)'
          }}>
            <Flame size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Chaos Engineering & Failure Simulation Lab
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Inject real or simulated outages to demonstrate Nagios incident detection and Puppet/Ansible automated self-healing.
            </p>
          </div>
        </div>

        {hasFault && (
          <button
            onClick={onHeal}
            disabled={isRunning}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.35rem',
              borderRadius: '8px',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            <Wrench size={16} />
            <span>Auto-Remediate & Heal All</span>
          </button>
        )}
      </div>

      {/* Outage Alert Banner */}
      {hasFault && (
        <div className="chaos-banner">
          <AlertOctagon size={18} color="#EF4444" />
          <span>
            <strong>ACTIVE OUTAGE:</strong> {chaos.description} &mdash; Nagios has triggered critical alerts! Click &quot;Auto-Remediate&quot; to restore baseline.
          </span>
        </div>
      )}

      {/* Fault Injection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        <button
          onClick={() => onInject('http_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn web"
        >
          <Zap size={15} color="#F43F5E" />
          <span>Crash Frontend (Nginx 80)</span>
        </button>

        <button
          onClick={() => onInject('backend_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn api"
        >
          <Server size={15} color="#F59E0B" />
          <span>Crash Backend API Tier</span>
        </button>

        <button
          onClick={() => onInject('db_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn db"
        >
          <Database size={15} color="#10B981" />
          <span>Crash Database Daemon</span>
        </button>

        <button
          onClick={() => onInject('cpu_spike')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn cpu"
        >
          <Cpu size={15} color="#A855F7" />
          <span>Simulate CPU Spike (&gt;90%)</span>
        </button>

        <button
          onClick={() => onInject('config_tamper')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="chaos-btn drift"
        >
          <RefreshCw size={15} color="#0EA5E9" />
          <span>Simulate Config Drift (/etc/motd)</span>
        </button>
      </div>
    </div>
  );
};
