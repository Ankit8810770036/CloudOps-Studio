import React from 'react';
import { Flame, Server, Zap, Wrench, AlertOctagon, Cpu, Database, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ChaosState, InfrastructureState, ExecutionMode } from '../types';

interface ChaosPanelProps {
  chaos: ChaosState;
  infra: InfrastructureState;
  onInject: (faultType: string) => void;
  onHeal: () => void;
  isRunning: boolean;
  mode?: ExecutionMode;
  onNavigate?: (tabId: string) => void;
}

export const ChaosPanel: React.FC<ChaosPanelProps> = React.memo(({
  chaos,
  infra,
  onInject,
  onHeal,
  isRunning,
  mode = 'simulation',
  onNavigate,
}) => {
  const isInfraReady = infra.status === 'ready';
  const hasFault = Boolean(chaos.active_fault);
  const isDriftFault = chaos.active_fault === 'config_tamper';
  const canInject = (mode === 'simulation' || isInfraReady) && !isRunning && !hasFault;

  const getButtonTitle = (actionName: string) => {
    if (isRunning) return 'Pipeline action currently in progress';
    if (hasFault) return 'Resolve current fault before injecting a new failure scenario';
    if (mode === 'live' && !isInfraReady) return 'Live EC2 target required: provision infrastructure with Step 1 (Terraform)';
    return actionName;
  };

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
              Inject outages and configuration drift to test automated detection and Puppet self-healing.
            </p>
          </div>
        </div>

        {hasFault && (
          <button
            onClick={onHeal}
            disabled={isRunning}
            className="btn-primary"
            style={{
              background: isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)',
              border: `1px solid ${isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)'}`,
              color: '#FFFFFF',
              height: '32px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
            title={isDriftFault ? "Invoke Puppet desired-state engine to heal drift" : "Restart failed service and restore baseline"}
          >
            {isDriftFault ? <ShieldCheck size={14} /> : <Wrench size={13} />}
            <span>{isDriftFault ? 'Puppet Reconcile & Heal' : 'Auto-Remediate'}</span>
          </button>
        )}
      </div>

      {/* Live Mode Missing Infra Banner */}
      {!isInfraReady && mode === 'live' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={15} color="var(--status-warning, #eab308)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Live Target Required:</strong> Provision AWS infrastructure with Terraform (Step 1) before injecting live chaos.
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('tf')}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                borderRadius: '4px'
              }}
            >
              Go to Step 1: Terraform ➔
            </button>
          )}
        </div>
      )}

      {/* Outage / Drift Alert Banner */}
      {hasFault && (
        <div
          className="chaos-banner"
          style={{
            background: isDriftFault ? 'rgba(217, 119, 6, 0.12)' : undefined,
            border: isDriftFault ? '1px solid var(--accent-puppet)' : undefined,
            color: isDriftFault ? 'var(--text-primary)' : undefined
          }}
        >
          {isDriftFault ? (
            <ShieldCheck size={15} color="var(--accent-puppet)" style={{ flexShrink: 0 }} />
          ) : (
            <AlertOctagon size={15} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          )}
          <span>
            <strong>{isDriftFault ? 'SECURITY DRIFT INJECTED:' : 'ACTIVE OUTAGE:'}</strong> {chaos.description || 'System state deviated from baseline'} &mdash; Click {isDriftFault ? '"Puppet Reconcile & Heal"' : '"Auto-Remediate"'} to restore compliance.
          </span>
        </div>
      )}

      {/* Fault Injection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.55rem' }}>
        <button
          onClick={() => onInject('http_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Frontend Nginx Service')}
        >
          <Zap size={13} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          <span>Crash Frontend (80)</span>
        </button>

        <button
          onClick={() => onInject('backend_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Microservice Backend API')}
        >
          <Server size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
          <span>Crash Backend API</span>
        </button>

        <button
          onClick={() => onInject('db_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Database Server')}
        >
          <Database size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
          <span>Crash Database</span>
        </button>

        <button
          onClick={() => onInject('cpu_spike')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Stress CPU to 96%')}
        >
          <Cpu size={13} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
          <span>CPU Spike (&gt;90%)</span>
        </button>

        <button
          onClick={() => onInject('config_tamper')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Inject unauthorized drift into /etc/motd and security baseline to trigger Puppet reconciliation')}
        >
          <ShieldCheck size={13} color="var(--accent-puppet)" style={{ flexShrink: 0 }} />
          <span>Tamper Config (Puppet Drift)</span>
        </button>
      </div>
    </div>
  );
});
