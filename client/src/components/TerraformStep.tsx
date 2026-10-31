import React, { useState } from 'react';
import { Layers, Play, Trash2, Shield, HardDrive, Cpu, Key } from 'lucide-react';
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
      <div className="panel-header">
        <h3>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(168, 85, 247, 0.18)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#D8B4FE'
          }}>
            <Layers size={16} />
          </div>
          <span>Step 1: Terraform Infrastructure as Code</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '0.25rem 0.65rem',
          borderRadius: '6px',
          background: isProvisioned ? 'rgba(16, 185, 129, 0.18)' : 'rgba(255, 153, 0, 0.15)',
          color: isProvisioned ? '#34D399' : '#FFA726',
          border: isProvisioned ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 153, 0, 0.35)',
          letterSpacing: '0.04em'
        }}>
          {infra.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: '1.6' }}>
        Declaratively provisions AWS VPC, Security Group with restricted ingress (ports 22, 80, 443, 5000-8080, 5666), and EC2 instance running Ubuntu 22.04 LTS.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">AWS Region</label>
          <select
            className="form-select"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            disabled={isRunning || isProvisioned}
          >
            <option value="us-east-1">US East (N. Virginia) [us-east-1]</option>
            <option value="us-west-2">US West (Oregon) [us-west-2]</option>
            <option value="eu-west-1">EU (Ireland) [eu-west-1]</option>
            <option value="ap-south-1">Asia Pacific (Mumbai) [ap-south-1]</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">EC2 Instance Type</label>
          <select
            className="form-select"
            value={instanceType}
            onChange={(e) => setInstanceType(e.target.value)}
            disabled={isRunning || isProvisioned}
          >
            <option value="t2.micro">t2.micro (1 vCPU, 1 GB RAM - Free Tier)</option>
            <option value="t3.micro">t3.micro (2 vCPU, 1 GB RAM)</option>
            <option value="t3.small">t3.small (2 vCPU, 2 GB RAM)</option>
          </select>
        </div>
      </div>

      {/* Resource Spec Box */}
      <div className="spec-box">
        <div className="spec-row">
          <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Shield size={14} color="#A855F7" />
            <span>Security Ingress:</span>
          </span>
          <span className="spec-value" style={{ color: '#D8B4FE' }}>
            22, 80, 443, 5000, 8000, 8080, 5666
          </span>
        </div>
        <div className="spec-row">
          <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <HardDrive size={14} color="#38BDF8" />
            <span>Storage Volume:</span>
          </span>
          <span className="spec-value">20 GB gp3 High-IOPS SSD</span>
        </div>
        <div className="spec-row">
          <span className="spec-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Key size={14} color="#FF9900" />
            <span>SSH Keypair:</span>
          </span>
          <span className="spec-value">devops-key.pem (RSA 4096-bit)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{
            flex: 1,
            background: isProvisioned ? 'var(--bg-card-subtle)' : 'var(--accent-terraform-gradient)',
            color: '#FFFFFF',
            border: isProvisioned ? '1px solid var(--border-color)' : 'none',
            boxShadow: isProvisioned ? 'none' : '0 4px 14px rgba(168, 85, 247, 0.4)'
          }}
          onClick={() => onApply(region, instanceType)}
          disabled={isRunning || isProvisioned}
        >
          <Play size={16} />
          <span>{isProvisioned ? 'Infrastructure Provisioned (Ready)' : 'Provision Infrastructure (Terraform Apply)'}</span>
        </button>

        {isProvisioned && (
          <button
            className="btn-danger"
            onClick={onDestroy}
            disabled={isRunning}
            title="Tear down all AWS resources created by Terraform"
          >
            <Trash2 size={16} />
            <span>Destroy</span>
          </button>
        )}
      </div>
    </div>
  );
};
