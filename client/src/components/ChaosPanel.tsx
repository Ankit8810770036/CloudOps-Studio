import React from 'react';
import { Flame, ShieldAlert, Zap, Wrench, AlertOctagon } from 'lucide-react';
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
    <div style={{
      background: hasFault ? 'rgba(239, 68, 68, 0.08)' : 'rgba(17, 24, 39, 0.6)',
      border: hasFault ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '1.25rem 1.5rem',
      marginBottom: '1.5rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            background: hasFault ? 'rgba(239, 68, 68, 0.2)' : 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e'
          }}>
            <Flame size={18} />
          </div>
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>
              Chaos Engineering & Failure Simulation Lab
            </h4>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
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
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
            }}
          >
            <Wrench size={16} />
            <span>Auto-Remediate & Heal All</span>
          </button>
        )}
      </div>

      {hasFault && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          borderLeft: '4px solid #ef4444',
          padding: '0.65rem 0.85rem',
          borderRadius: '6px',
          fontSize: '0.82rem',
          color: '#fecaca',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <AlertOctagon size={16} color="#ef4444" />
          <span><strong>ACTIVE OUTAGE:</strong> {chaos.description} &mdash; Nagios has triggered critical alerts!</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
        <button
          onClick={() => onInject('http_down')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="btn-secondary"
          style={{
            justifyContent: 'center',
            borderColor: 'rgba(244, 63, 94, 0.3)',
            color: '#fb7185'
          }}
        >
          <Zap size={14} />
          <span>Simulate Web Crash (HTTP 502)</span>
        </button>

        <button
          onClick={() => onInject('cpu_spike')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="btn-secondary"
          style={{
            justifyContent: 'center',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            color: '#fbbf24'
          }}
        >
          <ShieldAlert size={14} />
          <span>Simulate CPU Spike (&gt;90%)</span>
        </button>

        <button
          onClick={() => onInject('config_tamper')}
          disabled={isRunning || !isInfraReady || hasFault}
          className="btn-secondary"
          style={{
            justifyContent: 'center',
            borderColor: 'rgba(192, 132, 252, 0.3)',
            color: '#c084fc'
          }}
        >
          <Flame size={14} />
          <span>Simulate Config Drift (/etc/motd)</span>
        </button>
      </div>
    </div>
  );
};
