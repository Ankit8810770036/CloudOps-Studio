import React, { useState } from 'react';
import { Package, Play, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';
import { DeploymentState, InfrastructureState } from '../types';

interface AnsibleStepProps {
  deployment: DeploymentState;
  infra: InfrastructureState;
  onDeploy: (webServer: 'nginx' | 'apache') => void;
  isRunning: boolean;
}

export const AnsibleStep: React.FC<AnsibleStepProps> = ({
  deployment,
  infra,
  onDeploy,
  isRunning,
}) => {
  const [selectedServer, setSelectedServer] = useState<'nginx' | 'apache'>('nginx');
  const isInfraReady = infra.status === 'ready';
  const isDeployed = deployment.status === 'deployed';

  return (
    <div className="panel-card">
      <div className="panel-header">
        <h3>
          <Package size={18} color="#f87171" />
          <span>Step 2: Ansible Web Server & App Deployment</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: '6px',
          background: isDeployed ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.08)',
          color: isDeployed ? '#34d399' : '#94a3b8'
        }}>
          {deployment.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
        Runs idempotent Ansible roles to install and configure the web server, deploy the responsive application assets to <code>/var/www/devops_app</code>, and verify HTTP 200 response.
      </p>

      <div className="form-group">
        <label className="form-label">Web Server Architecture</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setSelectedServer('nginx')}
            disabled={isRunning || !isInfraReady}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: selectedServer === 'nginx' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedServer === 'nginx' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0, 0, 0, 0.25)',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Nginx (Recommended)</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Event-driven, high throughput</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedServer('apache')}
            disabled={isRunning || !isInfraReady}
            style={{
              padding: '0.75rem',
              borderRadius: '8px',
              border: selectedServer === 'apache' ? '2px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: selectedServer === 'apache' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(0, 0, 0, 0.25)',
              color: '#f8fafc',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.2rem'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Apache HTTP Server</span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Multi-process, virtual host support</span>
          </button>
        </div>
      </div>

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
          <span style={{ color: '#94a3b8' }}>Target Node Host:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{infra.public_ip || 'Provision with Step 1 first'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Playbook File:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>ansible/site.yml</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Web Root:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>/var/www/devops_app (Port 80)</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, background: 'linear-gradient(135deg, #ee0000 0%, #ea580c 100%)' }}
          onClick={() => onDeploy(selectedServer)}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={16} />
          <span>Deploy Stack (Ansible Playbook)</span>
        </button>

        {isDeployed && infra.app_url && (
          <a
            href={infra.app_url}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}
          >
            <span>Open App</span>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
};
