import React, { useState, useEffect } from 'react';
import {
  Package,
  Play,
  ExternalLink,
  Code2,
  Save,
  Eye,
  Check,
  Database,
  Server,
  Layout,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { CircularLoader } from './CircularLoader';
import { DeploymentState, InfrastructureState, StackConfig, CustomCodeState } from '../types';
import { fetchWebappContent, saveWebappContent } from '../services/api';

interface AnsibleStepProps {
  deployment: DeploymentState;
  infra: InfrastructureState;
  stack?: StackConfig;
  customCode?: CustomCodeState;
  onDeploy: (webServer: 'nginx' | 'apache', frontend: string, backend: string, database: string) => void;
  isRunning: boolean;
  onRefreshStatus?: () => void;
}

export const AnsibleStep: React.FC<AnsibleStepProps> = React.memo(({
  deployment,
  infra,
  stack,
  customCode: _customCode,
  onDeploy,
  isRunning,
  onRefreshStatus: _onRefreshStatus,
}) => {
  const [selectedServer] = useState<'nginx' | 'apache'>('nginx');
  
  // 3-Tier Stack Selection State
  const [frontendType, setFrontendType] = useState<string>(stack?.frontend?.type || 'react');
  const [backendType, setBackendType] = useState<string>(stack?.backend?.type || 'none');
  const [databaseType, setDatabaseType] = useState<string>(stack?.database?.type || 'none');
  const hasBackend = backendType !== 'none';

  useEffect(() => {
    if (stack?.frontend?.type) setFrontendType(stack.frontend.type);
    if (stack?.backend?.type) setBackendType(stack.backend.type);
    if (stack?.database?.type) setDatabaseType(stack.database.type);
  }, [stack?.frontend?.type, stack?.backend?.type, stack?.database?.type]);

  const [showEditor, setShowEditor] = useState(false);

  // HTML Editor State
  const [htmlCode, setHtmlCode] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const isInfraReady = infra.status === 'ready';
  const isDeployed = deployment.status === 'deployed';
  const [isDeployingLocally, setIsDeployingLocally] = useState(false);
  const isStepRunning = isRunning || isDeployingLocally;

  const handleDeployClick = async () => {
    if (isStepRunning || !isInfraReady) return;
    setIsDeployingLocally(true);
    try {
      await onDeploy(selectedServer, frontendType, backendType, databaseType);
    } finally {
      setTimeout(() => setIsDeployingLocally(false), 3000);
    }
  };

  useEffect(() => {
    fetchWebappContent()
      .then(res => setHtmlCode(res.html))
      .catch(() => {});
  }, []);

  const handleSaveHtml = async () => {
    await saveWebappContent(htmlCode);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getBackendPort = () => {
    if (backendType === 'java_springboot') return 8080;
    if (backendType === 'nodejs') return 5000;
    if (backendType === 'python') return 8000;
    if (backendType === 'docker') return 8000;
    return 0;
  };

  const getFrontendLabel = (type: string) => {
    if (type === 'react') return 'React SPA';
    if (type === 'html') return 'Static HTML5';
    if (type === 'nodejs_ssr') return 'Node.js SSR';
    return 'Frontend UI';
  };

  const previewUrl = (infra.app_url && !infra.app_url.includes('54.210.88')) 
    ? infra.app_url 
    : 'http://127.0.0.1:8000/api/webapp/preview';

  return (
    <div className="panel-card" style={{ gridColumn: 'span 2' }}>
      <div>
        {/* Header */}
        <div className="panel-header">
          <h3>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              background: 'rgba(220, 38, 38, 0.12)',
              border: '1px solid rgba(220, 38, 38, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-ansible)',
              flexShrink: 0
            }}>
              <Package size={14} />
            </div>
            <span>Step 2: Ansible Deployment</span>
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.15rem 0.55rem',
              borderRadius: '4px',
              background: isDeployed ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
              color: isDeployed ? 'var(--status-success)' : 'var(--aws-orange)',
              border: `1px solid ${isDeployed ? 'var(--status-success)' : 'var(--status-warning)'}`,
              letterSpacing: '0.04em'
            }}>
              {deployment.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Active In-Card Processing Indicator */}
        {isStepRunning && (
          <div className="step-card-running-overlay" style={{ borderColor: 'rgba(220, 38, 38, 0.35)', background: 'rgba(220, 38, 38, 0.08)' }}>
            <CircularLoader size={16} color="var(--accent-ansible)" />
            <span>
              <strong>Ansible Deployment Active:</strong> Configuring Nginx and deploying {frontendType.toUpperCase()} + {backendType.toUpperCase()} stack...
            </span>
          </div>
        )}

        {/* 3-Tier Customization Selectors Grid (Non-Overflowing) */}
        <div className="tier-container-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: '0.75rem' }}>
            {/* Tier 1: Frontend */}
            <div className="tier-card">
              <div className="tier-badge frontend">
                <Layout size={14} />
                <span>1. Frontend UI</span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-select"
                  value={frontendType}
                  onChange={(e) => setFrontendType(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="react">React SPA (Vite)</option>
                  <option value="html">Static HTML5</option>
                  <option value="nodejs_ssr">Node.js SSR</option>
                </select>
              </div>
            </div>

            {/* Tier 2: Backend */}
            <div className="tier-card">
              <div className="tier-badge backend">
                <Server size={14} />
                <span>2. Backend API</span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-select"
                  value={backendType}
                  onChange={(e) => setBackendType(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="python">Python (FastAPI - 8000)</option>
                  <option value="java_springboot">Java (Spring Boot - 8080)</option>
                  <option value="nodejs">Node.js (Express - 5000)</option>
                  <option value="docker">🐳 Docker Container (Polyglot - 8000)</option>
                  <option value="none">None (Frontend Only)</option>
                </select>
              </div>
            </div>

            {/* Tier 3: Database */}
            <div className="tier-card">
              <div className="tier-badge database">
                <Database size={14} />
                <span>3. Database</span>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <select
                  className="form-select"
                  value={databaseType}
                  onChange={(e) => setDatabaseType(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="postgresql">PostgreSQL 15 (Port 5432)</option>
                  <option value="mysql">MySQL 8 (Port 3306)</option>
                  <option value="mongodb">MongoDB 7 (Port 27017)</option>
                  <option value="sqlite">SQLite 3 (Embedded)</option>
                  <option value="none">None (Stateless)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Live Topology Banner with Action Buttons */}
        <div className="topology-flow-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <Layers size={14} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem' }}>
              <strong>Topology:</strong>{' '}
              {hasBackend ? (
                <>
                  Nginx (80) ➔ /api/ ➔ <span style={{ color: 'var(--aws-orange)', fontWeight: 700 }}>{backendType.toUpperCase()} ({getBackendPort()})</span> ➔ <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{databaseType.toUpperCase()}</span>
                </>
              ) : (
                <>
                  Nginx (Port 80) ➔ <span style={{ color: 'var(--aws-orange)', fontWeight: 700 }}>{getFrontendLabel(frontendType)}</span> (Static Web Tier)
                </>
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Quick HTML Editor Button */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowEditor(!showEditor)}
              style={{ fontSize: '0.76rem', padding: '0 0.65rem', height: '30px' }}
            >
              <Code2 size={13} />
              <span>{showEditor ? 'Hide Code' : 'Edit HTML'}</span>
            </button>
          </div>
        </div>

        {/* Expandable Code Editor */}
        {showEditor && (
          <div className="code-editor-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.45rem' }}>
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                <code>ansible/roles/webapp/files/app/index.html</code>
              </span>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.74rem', padding: '0 0.55rem', height: '28px', textDecoration: 'none' }}>
                  <Eye size={12} />
                  <span>Preview</span>
                </a>
                <button type="button" className="btn-primary" onClick={handleSaveHtml} style={{ fontSize: '0.74rem', padding: '0 0.65rem', height: '28px' }}>
                  {isSaved ? <Check size={12} color="#FFFFFF" /> : <Save size={12} />}
                  <span>{isSaved ? 'Saved!' : 'Save Code'}</span>
                </button>
              </div>
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={6}
              style={{
                width: '100%',
                background: '#090D16',
                color: '#38BDF8',
                fontFamily: "'JetBrains Mono', Consolas, monospace",
                fontSize: '0.8rem',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.65rem',
                outline: 'none',
                resize: 'vertical',
                lineHeight: 1.45,
                boxSizing: 'border-box'
              }}
            />
          </div>
        )}

        {/* Step 2 Completion Confirmation Banner */}
        {isDeployed && (
          <div className="step-success-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981' }}>
                  Step 2 Completed: Application Stack Deployed
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Server: <strong style={{ color: 'var(--text-primary)' }}>{deployment.web_server.toUpperCase()}</strong> • App: <strong style={{ color: 'var(--text-primary)' }}>{deployment.deployed_app || 'Polyglot'}</strong> (Port 80)
                </div>
              </div>
            </div>
            {isDeployed && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="live-view-pill"
                title={`Open ${previewUrl}`}
              >
                <span>Live View</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Aligned Action Footer */}
      <div className="panel-footer-actions">
        <button
          className={`btn-primary ${isStepRunning ? 'is-running' : ''}`}
          style={{ flex: '1 1 240px', background: 'var(--accent-ansible)', color: '#FFFFFF', border: '1px solid var(--accent-ansible)' }}
          onClick={handleDeployClick}
          disabled={isStepRunning || !isInfraReady}
        >
          {isStepRunning ? (
            <>
              <CircularLoader size={14} color="#FFFFFF" />
              <span>Deploying Stack (Live)...</span>
            </>
          ) : (
            <>
              <Play size={14} />
              <span>Deploy Stack (Ansible)</span>
            </>
          )}
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ flex: '0 0 auto', opacity: isDeployed ? 1 : 0.4, pointerEvents: isDeployed ? 'auto' : 'none' }}
        >
          <ExternalLink size={14} />
          <span>Open Live Site</span>
        </a>
      </div>
    </div>
  );
});
