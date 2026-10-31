import React from 'react';
import { ShieldCheck, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { ComplianceState, InfrastructureState } from '../types';

interface PuppetStepProps {
  compliance: ComplianceState;
  infra: InfrastructureState;
  onEnforce: () => void;
  isRunning: boolean;
}

export const PuppetStep: React.FC<PuppetStepProps> = React.memo(({
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
      <div>
        {/* Header */}
        <div className="panel-header">
          <h3>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: 'rgba(217, 119, 6, 0.12)',
              border: '1px solid rgba(217, 119, 6, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-puppet)',
              flexShrink: 0
            }}>
              <ShieldCheck size={14} />
            </div>
            <span>Step 3: Puppet Compliance</span>
          </h3>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.15rem 0.55rem',
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

        {/* Minimal Subtitle */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
          Desired-state security baseline and drift self-healing.
        </p>

        {/* Drift Alert Banner */}
        {isDrift && (
          <div className="chaos-banner" style={{ marginBottom: '0.85rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--status-danger)', color: 'var(--text-primary)' }}>
            <AlertTriangle size={15} color="var(--status-danger)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Configuration Drift Detected:</strong> {compliance.drift_count} security policies tampered. Click &quot;Reconcile Drift&quot; to heal.
            </span>
          </div>
        )}

        {/* Compliance Rule Checklist */}
        <div className="spec-box" style={{ gap: '0.55rem', marginBottom: '0.85rem' }}>
          {compliance.rules_enforced.map((rule, idx) => {
            const isRuleDrifted = isDrift && (rule.status === 'drift_detected' || idx < 2);
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                {isCompliant ? (
                  <CheckCircle2 size={14} color="var(--status-success)" style={{ flexShrink: 0 }} />
                ) : isRuleDrifted ? (
                  <AlertTriangle size={14} color="var(--status-danger)" style={{ flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '1.5px solid var(--border-bright)', flexShrink: 0 }} />
                )}
                <span style={{
                  color: isRuleDrifted ? 'var(--status-danger)' : 'var(--text-primary)',
                  fontWeight: isRuleDrifted ? 700 : 500
                }}>
                  {rule.name}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.76rem',
          color: 'var(--text-muted)',
          marginBottom: '0.75rem',
          padding: '0 0.15rem'
        }}>
          <span>Last Enforced: <strong style={{ color: 'var(--text-primary)' }}>{compliance.last_enforced || 'Pending'}</strong></span>
          <span style={{ color: compliance.drift_count > 0 ? 'var(--status-danger)' : 'var(--status-success)', fontWeight: 700 }}>
            {compliance.drift_count} Violations
          </span>
        </div>

        {/* Step 3 Completion Confirmation Banner */}
        {isCompliant && (
          <div className="step-success-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                  Step 3 Completed: Security Baseline Enforced
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Zero drift detected • Systemd, SSH hardening & firewall locked
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Aligned Action Footer */}
      <div className="panel-footer-actions">
        <button
          className="btn-primary"
          style={{
            flex: '1 1 200px',
            background: isCompliant ? 'var(--bg-card-subtle)' : isDrift ? 'var(--status-danger)' : 'var(--accent-puppet)',
            color: isCompliant ? 'var(--text-muted)' : '#FFFFFF',
            border: isCompliant ? '1px solid var(--border-color)' : isDrift ? '1px solid var(--status-danger)' : '1px solid var(--accent-puppet)'
          }}
          onClick={onEnforce}
          disabled={isRunning || !isInfraReady}
          title={isDrift ? "Reconcile drift back to baseline" : "Enforce Puppet security baseline"}
        >
          {isDrift ? <RefreshCw size={14} /> : <Play size={14} />}
          <span>{isCompliant ? 'Compliant (Zero Drift)' : isDrift ? 'Reconcile Drift (Puppet)' : 'Enforce (Puppet)'}</span>
        </button>
      </div>
    </div>
  );
});
