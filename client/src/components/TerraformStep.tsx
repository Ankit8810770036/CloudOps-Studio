import React, { useState } from 'react';
import { Layers, Play, Trash2, CheckCircle2, Shield, HardDrive, Cpu, Terminal as TerminalIcon } from 'lucide-react';
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
          <Layers size={18} color="#c084fc" />
          <span>Step 1: Terraform Infrastructure as Code</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: '6px',
          background: isProvisioned ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          color: isProvisioned ? '#34d399' : '#94a3b8'
        }}>
          {infra.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
        Declaratively provisions AWS VPC, Security Group with restricted ingress (ports 22, 80, 443, 5666), and EC2 instance running Ubuntu 22.04 LTS.
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

      {/* Resource Spec Cards */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.83rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Security Group Ingress:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>22 (SSH), 80 (HTTP), 443, 5666 (NRPE)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Storage:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>20 GB gp3 Root Volume</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>SSH Keypair:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>devops-key.pem (RSA 4096-bit)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, background: 'linear-gradient(135deg, #844fba 0%, #6366f1 100%)' }}
          onClick={() => onApply(region, instanceType)}
          disabled={isRunning || isProvisioned}
        >
          <Play size={16} />
          <span>Provision Infrastructure (Terraform Apply)</span>
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
