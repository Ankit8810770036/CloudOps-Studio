import React from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle } from 'lucide-react';
import { ComplianceState, InfrastructureState } from '../types';

interface PuppetStepProps {
  compliance: ComplianceState;
  infra: InfrastructureState;
  onEnforce: () => void;
  isRunning: boolean;
}

export const PuppetStep: React.FC<PuppetStepProps> = ({
  compliance,
  infra,
  onEnforce,
  isRunning,
}) => {
  const isInfraReady = infra.status === 'ready';
  const isCompliant = compliance.status === 'compliant';
  const isDrift = compliance.status === 'drift_detected';

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(217, 119, 6, 0.12)',
            border: '1px solid rgba(217, 119, 6, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-puppet)',
            flexShrink: 0
          }}>
            <ShieldCheck size={15} />
          </div>
          <span>Step 3: Puppet Compliance & Drift Baseline</span>
        </h3>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          background: isCompliant ? 'var(--status-success-bg)' :
                      isDrift ? 'var(--status-danger-bg)' : 'var(--status-warning-bg)',
          color: isCompliant ? 'var(--status-success)' :
                 isDrift ? 'var(--status-danger)' : 'var(--aws-orange)',
          border: `1px solid ${isCompliant ? 'var(--status-success)' : isDrift ? 'var(--status-danger)' : 'var(--status-warning)'}`,
          letterSpacing: '0.04em'
        }}>
          {compliance.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.15rem' }}>
        Enforces desired system state via Puppet manifests. Protects against configuration drift, hardens SSH security, isolates database to 127.0.0.1, and supervises backend daemons.
      </p>

      {/* Compliance Rule Checklist */}
      <div className="spec-box" style={{ gap: '0.65rem', marginBottom: '1.15rem' }}>
        {compliance.rules_enforced.map((rule, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem' }}>
            {isCompliant ? (
              <CheckCircle2 size={15} color="var(--status-success)" />
            ) : isDrift && idx === 1 ? (
              <AlertTriangle size={15} color="var(--status-danger)" />
            ) : (
              <div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid var(--border-bright)', flexShrink: 0 }} />
            )}
            <span style={{
              color: isDrift && idx === 1 ? 'var(--status-danger)' : 'var(--text-primary)',
              fontWeight: isDrift && idx === 1 ? 700 : 500
            }}>
              {rule.name}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '0.85rem',
        padding: '0 0.15rem'
      }}>
        <span>Last Enforced: <strong style={{ color: 'var(--text-primary)' }}>{compliance.last_enforced || 'Pending'}</strong></span>
        <span style={{ color: compliance.drift_count > 0 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 700 }}>
          {compliance.drift_count} Active Violations
        </span>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{
            width: '100%',
            background: 'var(--accent-puppet)',
            border: '1px solid var(--accent-puppet)',
            color: '#FFFFFF',
            fontWeight: 700
          }}
          onClick={onEnforce}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={15} />
          <span>Enforce Compliance (Puppet Apply)</span>
        </button>
      </div>
    </div>
  );
};
