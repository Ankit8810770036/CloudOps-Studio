import React, { useState } from 'react';
import { Layers, Play, Trash2, Shield, HardDrive, Key, CheckCircle2 } from 'lucide-react';
import { InfrastructureState } from '../types';

interface TerraformStepProps {
  infra: InfrastructureState;
  onApply: (region: string, instanceType: string) => void;
  onDestroy: () => void;
  isRunning: boolean;
}

export const TerraformStep: React.FC<TerraformStepProps> = ({
  infra,
  onApply,
  onDestroy,
  isRunning,
}) => {
  const [region, setRegion] = useState('us-east-1');
  const [instanceType, setInstanceType] = useState('t2.micro');

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
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              disabled={isRunning || isProvisioned}
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-south-1">ap-south-1 (Mumbai)</option>
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
          onClick={() => onApply(region, instanceType)}
          disabled={isRunning || isProvisioned}
        >
          <Play size={14} />
          <span>{isProvisioned ? 'Provisioned (Ready)' : 'Apply (Terraform)'}</span>
        </button>

        {isProvisioned && (
          <button
            className="btn-danger"
            onClick={onDestroy}
            disabled={isRunning}
            title="Tear down all AWS resources"
            style={{ flex: '0 0 auto' }}
          >
            <Trash2 size={14} />
            <span>Destroy</span>
          </button>
        )}
      </div>
    </div>
  );
};
