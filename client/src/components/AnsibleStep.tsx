import React, { useState, useEffect } from 'react';
import { Package, Play, ExternalLink, Code2, Save, Eye, Check, Database, Server, Layout, Sparkles, Layers } from 'lucide-react';
import { DeploymentState, InfrastructureState, StackConfig } from '../types';
import { fetchWebappContent, saveWebappContent } from '../services/api';

interface AnsibleStepProps {
  deployment: DeploymentState;
  infra: InfrastructureState;
  stack?: StackConfig;
  onDeploy: (webServer: 'nginx' | 'apache', frontend: string, backend: string, database: string) => void;
  isRunning: boolean;
}

export const AnsibleStep: React.FC<AnsibleStepProps> = ({
  deployment,
  infra,
  onDeploy,
  isRunning,
}) => {
  const [selectedServer] = useState<'nginx' | 'apache'>('nginx');
  
  // 3-Tier Stack Selection State
  const [frontendType, setFrontendType] = useState<string>('react');
  const [backendType, setBackendType] = useState<string>('python');
  const [databaseType, setDatabaseType] = useState<string>('postgresql');
  
  const [showEditor, setShowEditor] = useState(false);
  const [htmlCode, setHtmlCode] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  const isInfraReady = infra.status === 'ready';
  const isDeployed = deployment.status === 'deployed';

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

  // Quick Preset Handlers
  const applyPreset = (preset: 'python' | 'spring' | 'mern' | 'static') => {
    if (preset === 'python') {
      setFrontendType('react');
      setBackendType('python');
      setDatabaseType('postgresql');
    } else if (preset === 'spring') {
      setFrontendType('react');
      setBackendType('java_springboot');
      setDatabaseType('mysql');
    } else if (preset === 'mern') {
      setFrontendType('react');
      setBackendType('nodejs');
      setDatabaseType('mongodb');
    } else if (preset === 'static') {
      setFrontendType('html');
      setBackendType('none');
      setDatabaseType('none');
    }
  };

  const getBackendPort = () => {
    if (backendType === 'java_springboot') return 8080;
    if (backendType === 'nodejs') return 5000;
    if (backendType === 'python') return 8000;
    return 0;
  };

  const previewUrl = isDeployed && infra.app_url ? infra.app_url : 'http://127.0.0.1:8000/api/webapp/preview';

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

        {/* Minimal Subtitle */}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.85rem' }}>
          Configures Frontend, Backend runtime, Database, and Nginx reverse proxy.
        </p>

        {/* Quick Architecture Presets */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.55rem' }}>
            <button
              type="button"
              className={`preset-chip ${backendType === 'python' ? 'active-preset' : ''}`}
              onClick={() => applyPreset('python')}
            >
              <span>🐍</span>
              <div>
                <div style={{ fontWeight: 700 }}>Python Stack</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>FastAPI + Postgres</div>
              </div>
            </button>

            <button
              type="button"
              className={`preset-chip ${backendType === 'java_springboot' ? 'active-preset' : ''}`}
              onClick={() => applyPreset('spring')}
            >
              <span>☕</span>
              <div>
                <div style={{ fontWeight: 700 }}>Java Stack</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Spring Boot + MySQL</div>
              </div>
            </button>

            <button
              type="button"
              className={`preset-chip ${backendType === 'nodejs' ? 'active-preset' : ''}`}
              onClick={() => applyPreset('mern')}
            >
              <span>🟢</span>
              <div>
                <div style={{ fontWeight: 700 }}>Node.js Stack</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Express + Mongo</div>
              </div>
            </button>

            <button
              type="button"
              className={`preset-chip ${backendType === 'none' ? 'active-preset' : ''}`}
              onClick={() => applyPreset('static')}
            >
              <span>🌐</span>
              <div>
                <div style={{ fontWeight: 700 }}>Static Web</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>HTML5 + Nginx</div>
              </div>
            </button>
          </div>
        </div>

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

        {/* Live Topology Banner */}
        <div className="topology-flow-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <Layers size={14} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Topology:</strong> Nginx (80) ➔ /api/ ➔ <span style={{ color: 'var(--aws-orange)', fontWeight: 700 }}>{backendType.toUpperCase()} ({getBackendPort()})</span> ➔ <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{databaseType.toUpperCase()}</span>
            </span>
          </div>
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
      </div>

      {/* Aligned Action Footer */}
      <div className="panel-footer-actions">
        <button
          className="btn-primary"
          style={{ flex: '1 1 240px', background: 'var(--accent-ansible)', color: '#FFFFFF', border: '1px solid var(--accent-ansible)' }}
          onClick={() => onDeploy(selectedServer, frontendType, backendType, databaseType)}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={14} />
          <span>Deploy Stack (Ansible)</span>
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--aws-blue)', fontWeight: 700, flex: '0 0 auto' }}
        >
          <span>{isDeployed ? 'Open App' : 'Preview Site'}</span>
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
};
