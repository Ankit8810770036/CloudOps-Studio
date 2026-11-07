import React, { useState } from 'react';
import { Layers, Play, Trash2, Shield, HardDrive, Key, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { InfrastructureState } from '../types';

interface TerraformStepProps {
  infra: InfrastructureState;
  onApply: (region: string, instanceType: string) => void;
  onDestroy: () => void;
  isRunning: boolean;
  selectedRegion?: string;
  onSelectRegion?: (region: string) => void;
}

export const TerraformStep: React.FC<TerraformStepProps> = React.memo(({
  infra,
  onApply,
  onDestroy,
  isRunning,
  selectedRegion,
  onSelectRegion,
}) => {
  const [localRegion, setLocalRegion] = useState('ap-south-1');
  const [instanceType, setInstanceType] = useState('t3.micro');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');

  const activeRegion = selectedRegion ?? localRegion;

  const handleRegionChange = (newRegion: string) => {
    setLocalRegion(newRegion);
    if (onSelectRegion) {
      onSelectRegion(newRegion);
    }
  };

  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setConfirmInput('');
  };

  const isProvisioned = infra.status === 'ready';

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
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-terraform)',
              flexShrink: 0
            }}>
              <Layers size={14} />
            </div>
            <span>Step 1: Terraform IaC</span>
          </h3>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.15rem 0.55rem',
            borderRadius: '4px',
            background: isProvisioned ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
            color: isProvisioned ? 'var(--status-success)' : 'var(--aws-orange)',
            border: `1px solid ${isProvisioned ? 'var(--status-success)' : 'var(--status-warning)'}`,
            letterSpacing: '0.04em'
          }}>
            {infra.status.toUpperCase()}
          </span>
        </div>

        {/* Minimal Subtitle */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
          AWS VPC, Subnets, Security Groups & Ubuntu 22.04 EC2 compute.
        </p>

        {/* Region & Instance Selectors (Never Overflow) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem', marginBottom: '0.85rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">AWS Region</label>
            <select
              className="form-select"
              value={activeRegion}
              onChange={(e) => handleRegionChange(e.target.value)}
              disabled={isRunning || isProvisioned}
            >
              <option value="ap-south-1">ap-south-1 (Mumbai)</option>
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">EC2 Instance</label>
            <select
              className="form-select"
              value={instanceType}
              onChange={(e) => setInstanceType(e.target.value)}
              disabled={isRunning || isProvisioned}
            >
              <option value="t2.micro">t2.micro (1 vCPU, 1 GB)</option>
              <option value="t3.micro">t3.micro (2 vCPU, 1 GB)</option>
              <option value="t3.small">t3.small (2 vCPU, 2 GB)</option>
            </select>
          </div>
        </div>

        {/* Resource Spec Box */}
        <div className="spec-box">
          <div className="spec-row">
            <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={13} color="var(--accent-terraform)" />
              <span>Ingress Ports:</span>
            </span>
            <span className="spec-value">22, 80, 443, 5000-8080, 5666</span>
          </div>
          <div className="spec-row">
            <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <HardDrive size={13} color="var(--aws-blue)" />
              <span>Storage:</span>
            </span>
            <span className="spec-value">20 GB gp3 SSD</span>
          </div>
          <div className="spec-row">
            <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={13} color="var(--aws-orange)" />
              <span>SSH Keypair:</span>
            </span>
            <span className="spec-value">devops-key.pem (RSA 4096)</span>
          </div>
        </div>

        {/* Step 1 Completion Confirmation Banner */}
        {isProvisioned && (
          <div className="step-success-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                  Step 1 Completed: Infrastructure Provisioned
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Public IP: <strong style={{ color: 'var(--text-primary)' }}>{infra.public_ip || 'Assigned'}</strong> • VPC Subnets & Security Groups Configured
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
            background: isProvisioned ? 'var(--bg-card-subtle)' : 'var(--accent-terraform)',
            color: isProvisioned ? 'var(--text-muted)' : '#FFFFFF',
            border: isProvisioned ? '1px solid var(--border-color)' : '1px solid var(--accent-terraform)'
          }}
          onClick={() => onApply(activeRegion, instanceType)}
          disabled={isRunning || isProvisioned}
        >
          <Play size={14} />
          <span>{isProvisioned ? 'Provisioned (Ready)' : 'Apply (Terraform)'}</span>
        </button>

        {isProvisioned && (
          <button
            className="btn-danger"
            onClick={() => {
              setIsConfirmOpen(true);
              setConfirmInput('');
            }}
            disabled={isRunning}
            title="Tear down all AWS resources with confirmation guardrail"
            style={{ flex: '0 0 auto' }}
          >
            <Trash2 size={14} />
            <span>Destroy</span>
          </button>
        )}
      </div>

      {/* Safety Guardrail Confirmation Modal */}
      {isConfirmOpen && (
        <div className="modal-overlay" onClick={handleCloseConfirm}>
          <div
            className="modal-content"
            style={{ maxWidth: '440px', padding: '1.25rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: 5, background: 'var(--status-danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--status-danger)' }}>
                  <AlertTriangle size={16} />
                </div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirm Infrastructure Teardown
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCloseConfirm}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.45, marginBottom: '0.85rem' }}>
              This will permanently terminate the EC2 compute instance and tear down all VPC network resources. This action cannot be undone.
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                To confirm, type <strong style={{ color: 'var(--status-danger)' }}>destroy</strong> below:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="type destroy"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                autoFocus
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCloseConfirm}
                style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled={confirmInput.trim().toLowerCase() !== 'destroy' || isRunning}
                onClick={() => {
                  handleCloseConfirm();
                  onDestroy();
                }}
                style={{
                  height: '34px',
                  fontSize: '0.8rem',
                  padding: '0 1rem',
                  opacity: confirmInput.trim().toLowerCase() === 'destroy' ? 1 : 0.5,
                  cursor: confirmInput.trim().toLowerCase() === 'destroy' ? 'pointer' : 'not-allowed'
                }}
              >
                <Trash2 size={13} />
                <span>Confirm Teardown</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
