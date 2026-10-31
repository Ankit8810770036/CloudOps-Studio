import React from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle, Shield } from 'lucide-react';
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
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(245, 158, 11, 0.18)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FBBF24'
          }}>
            <ShieldCheck size={16} />
          </div>
          <span>Step 3: Puppet Compliance & Drift Baseline</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          background: isCompliant ? 'rgba(16, 185, 129, 0.18)' :
                      isDrift ? 'rgba(239, 68, 68, 0.18)' : 'rgba(245, 158, 11, 0.15)',
          color: isCompliant ? '#34D399' : isDrift ? '#F87171' : '#FBBF24',
          border: isCompliant ? '1px solid rgba(16, 185, 129, 0.35)' :
                  isDrift ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
          letterSpacing: '0.04em'
        }}>
          {compliance.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Enforces desired system state via Puppet manifests. Protects against configuration drift, hardens SSH security, isolates database to 127.0.0.1, and supervises backend daemons.
      </p>

      {/* Compliance Rule Checklist */}
      <div className="spec-box" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
        {compliance.rules_enforced.map((rule, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.84rem' }}>
            {isCompliant ? (
              <CheckCircle2 size={16} color="#10B981" />
            ) : isDrift && idx === 1 ? (
              <AlertTriangle size={16} color="#EF4444" />
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border-bright)' }}></div>
            )}
            <span style={{
              color: isDrift && idx === 1 ? '#EF4444' : 'var(--text-primary)',
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
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        marginBottom: '1rem',
        padding: '0 0.2rem'
      }}>
        <span>Last Enforced: <strong style={{ color: 'var(--text-primary)' }}>{compliance.last_enforced || 'Pending'}</strong></span>
        <span style={{ color: compliance.drift_count > 0 ? '#EF4444' : '#10B981', fontWeight: 800 }}>
          {compliance.drift_count} Active Violations
        </span>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{
            width: '100%',
            background: 'var(--accent-puppet-gradient)',
            color: '#1E1E1E',
            fontWeight: 800,
            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
          }}
          onClick={onEnforce}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={16} color="#1E1E1E" />
          <span>Enforce Compliance (Puppet Apply)</span>
        </button>
      </div>
    </div>
  );
};
