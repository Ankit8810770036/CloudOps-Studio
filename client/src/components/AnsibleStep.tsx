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
      {/* Header */}
      <div className="panel-header">
        <h3>
          <Package size={20} color="var(--accent-ansible)" />
          <span>Step 2: Full-Stack Polyglot Deployment (Frontend &bull; Backend &bull; Database)</span>
        </h3>
        <span style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          background: isDeployed ? 'var(--status-success-bg)' : 'rgba(148, 163, 184, 0.15)',
          color: isDeployed ? 'var(--status-success)' : 'var(--text-dim)',
          border: `1px solid ${isDeployed ? 'var(--status-success)' : 'var(--border-color)'}`
        }}>
          {deployment.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
        Ansible automates provisioning and configuration of your entire application tier. Select or customize your <strong>Frontend (React / HTML)</strong>, <strong>Backend API runtime (Python / Java Spring Boot / Node.js)</strong>, and <strong>Database (PostgreSQL / MySQL / MongoDB / SQLite)</strong>.
      </p>

      {/* Quick Architecture Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--aws-orange)', marginBottom: '0.65rem' }}>
          <Sparkles size={15} />
          <span>1-Click Stack Presets:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            className={`preset-chip ${backendType === 'python' ? 'active-python' : ''}`}
            onClick={() => applyPreset('python')}
          >
            <span>🐍</span>
            <div>
              <div><strong>Python Full-Stack</strong></div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>React + FastAPI + PostgreSQL</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'java_springboot' ? 'active-spring' : ''}`}
            onClick={() => applyPreset('spring')}
          >
            <span>☕</span>
            <div>
              <div><strong>Enterprise Java</strong></div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>React + Spring Boot + MySQL</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'nodejs' ? 'active-mern' : ''}`}
            onClick={() => applyPreset('mern')}
          >
            <span>🟢</span>
            <div>
              <div><strong>MERN Stack</strong></div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>React + Node.js + MongoDB</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'none' ? 'active-static' : ''}`}
            onClick={() => applyPreset('static')}
          >
            <span>🌐</span>
            <div>
              <div><strong>Static Website</strong></div>
              <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>HTML5 / CSS3 / Nginx</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3-Tier Customization Selectors Grid */}
      <div className="tier-container-box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '1rem' }}>
          {/* Tier 1: Frontend */}
          <div className="tier-card">
            <div className="tier-badge frontend">
              <Layout size={16} />
              <span>1. Frontend UI Tier</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-select"
                value={frontendType}
                onChange={(e) => setFrontendType(e.target.value)}
                disabled={isRunning}
              >
                <option value="react">React Modern SPA (Vite + CSS Modules)</option>
                <option value="html">Static HTML5 / CSS3 / JavaScript</option>
                <option value="nodejs_ssr">Node.js Server-Rendered Interface</option>
              </select>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.45rem' }}>
              Served via Nginx Port 80 with Reverse Proxy
            </div>
          </div>

          {/* Tier 2: Backend */}
          <div className="tier-card">
            <div className="tier-badge backend">
              <Server size={16} />
              <span>2. Backend API Tier</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-select"
                value={backendType}
                onChange={(e) => setBackendType(e.target.value)}
                disabled={isRunning}
              >
                <option value="python">Python (FastAPI / Gunicorn - Port 8000)</option>
                <option value="java_springboot">Java (Spring Boot 3.2 Actuator - Port 8080)</option>
                <option value="nodejs">Node.js (Express REST Microservice - Port 5000)</option>
                <option value="none">None (Static Frontend Only)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.45rem' }}>
              Systemd daemon with automated /api/health probes
            </div>
          </div>

          {/* Tier 3: Database */}
          <div className="tier-card">
            <div className="tier-badge database">
              <Database size={16} />
              <span>3. Database Tier</span>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <select
                className="form-select"
                value={databaseType}
                onChange={(e) => setDatabaseType(e.target.value)}
                disabled={isRunning}
              >
                <option value="postgresql">PostgreSQL 15 (Relational SQL - Port 5432)</option>
                <option value="mysql">MySQL / MariaDB (Relational SQL - Port 3306)</option>
                <option value="mongodb">MongoDB 7 (Document NoSQL - Port 27017)</option>
                <option value="sqlite">SQLite 3 (Embedded File Database)</option>
                <option value="none">None (Stateless In-Memory)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.45rem' }}>
              Bound to 127.0.0.1, auto-migration schema
            </div>
          </div>
        </div>
      </div>

      {/* Live Architecture Flow Banner */}
      <div className="topology-flow-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Layers size={17} color="var(--aws-blue-bright)" />
          <span>
            <strong>Active Topology:</strong> User ➔ Nginx (Port 80) ➔ ProxyPass /api/ ➔ <span style={{ color: 'var(--accent-puppet)', fontWeight: 800 }}>{backendType.toUpperCase()} ({getBackendPort()})</span> ➔ <span style={{ color: 'var(--accent-nagios)', fontWeight: 800 }}>{databaseType.toUpperCase()}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowEditor(!showEditor)}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Code2 size={14} />
            <span>{showEditor ? 'Hide Editor' : 'Edit Website / HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Code Editor */}
      {showEditor && (
        <div className="code-editor-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.65rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
              Frontend Source Code: <code>ansible/roles/webapp/files/app/index.html</code>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.76rem', padding: '0.28rem 0.65rem', textDecoration: 'none' }}>
                <Eye size={13} />
                <span>Preview</span>
              </a>
              <button type="button" className="btn-primary" onClick={handleSaveHtml} style={{ fontSize: '0.76rem', padding: '0.28rem 0.85rem' }}>
                {isSaved ? <Check size={14} color="#10b981" /> : <Save size={14} />}
                <span>{isSaved ? 'Saved!' : 'Save Code'}</span>
              </button>
            </div>
          </div>
          <textarea
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            rows={7}
            style={{
              width: '100%',
              background: '#070B14',
              color: '#38BDF8',
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              fontSize: '0.82rem',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '0.85rem',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5
            }}
          />
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, background: 'var(--accent-ansible-gradient)', color: '#FFFFFF', boxShadow: '0 4px 16px rgba(255, 77, 77, 0.35)' }}
          onClick={() => onDeploy(selectedServer, frontendType, backendType, databaseType)}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={16} />
          <span>Deploy Full-Stack Application (Ansible Playbook)</span>
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--aws-blue-bright)', fontWeight: 700 }}
        >
          <span>{isDeployed ? 'Open App' : 'Preview Site'}</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};
