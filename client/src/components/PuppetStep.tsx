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
          <ShieldCheck size={18} color="#fbbf24" />
          <span>Step 3: Puppet Configuration Drift & Compliance</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: '6px',
          background: isCompliant ? 'rgba(16, 185, 129, 0.15)' :
                      isDrift ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          color: isCompliant ? '#34d399' : isDrift ? '#f87171' : '#fbbf24'
        }}>
          {compliance.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
        Enforces desired system state via Puppet manifests. Protects against configuration drift, hardens SSH security, installs monitoring agent prerequisites, and guarantees server compliance.
      </p>

      {/* Compliance Rule Checklist */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}>
        {compliance.rules_enforced.map((rule, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.83rem' }}>
            {isCompliant ? (
              <CheckCircle2 size={16} color="#10b981" />
            ) : isDrift && idx === 1 ? (
              <AlertTriangle size={16} color="#f43f5e" />
            ) : (
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #64748b' }}></div>
            )}
            <span style={{ color: isDrift && idx === 1 ? '#f87171' : '#cbd5e1' }}>{rule.name}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: '#94a3b8',
        marginBottom: '1rem'
      }}>
        <span>Last Enforced: {compliance.last_enforced || 'Never'}</span>
        <span style={{ color: compliance.drift_count > 0 ? '#f87171' : '#34d399', fontWeight: 600 }}>
          {compliance.drift_count} Active Drifts
        </span>
      </div>

      <div style={{ marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{ width: '100%', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#1e1e1e', fontWeight: 700 }}
          onClick={onEnforce}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={16} color="#1e1e1e" />
          <span>Enforce Compliance (Puppet Apply)</span>
        </button>
      </div>
    </div>
  );
};

