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
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'rgba(220, 38, 38, 0.12)',
            border: '1px solid rgba(220, 38, 38, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-ansible)',
            flexShrink: 0
          }}>
            <Package size={15} />
          </div>
          <span>Step 2: Full-Stack Polyglot Deployment (Frontend &bull; Backend &bull; Database)</span>
        </h3>
        <span style={{
          fontSize: '0.74rem',
          fontWeight: 700,
          padding: '0.2rem 0.6rem',
          borderRadius: '4px',
          background: isDeployed ? 'var(--status-success-bg)' : 'var(--status-warning-bg)',
          color: isDeployed ? 'var(--status-success)' : 'var(--aws-orange)',
          border: `1px solid ${isDeployed ? 'var(--status-success)' : 'var(--status-warning)'}`,
          letterSpacing: '0.04em'
        }}>
          {deployment.status.toUpperCase()}
        </span>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.15rem' }}>
        Ansible automates provisioning and configuration of your entire application tier. Select or customize your <strong>Frontend (React / HTML)</strong>, <strong>Backend API runtime (Python / Java Spring Boot / Node.js)</strong>, and <strong>Database (PostgreSQL / MySQL / MongoDB / SQLite)</strong>.
      </p>

      {/* Quick Architecture Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--aws-orange)', marginBottom: '0.55rem' }}>
          <Sparkles size={14} />
          <span>1-Click Stack Presets:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem' }}>
          <button
            type="button"
            className={`preset-chip ${backendType === 'python' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('python')}
          >
            <span style={{ fontSize: '1.1rem' }}>🐍</span>
            <div>
              <div style={{ fontWeight: 700 }}>Python Full-Stack</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>React + FastAPI + PostgreSQL</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'java_springboot' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('spring')}
          >
            <span style={{ fontSize: '1.1rem' }}>☕</span>
            <div>
              <div style={{ fontWeight: 700 }}>Enterprise Java</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>React + Spring Boot + MySQL</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'nodejs' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('mern')}
          >
            <span style={{ fontSize: '1.1rem' }}>🟢</span>
            <div>
              <div style={{ fontWeight: 700 }}>MERN Stack</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>React + Node.js + MongoDB</div>
            </div>
          </button>

          <button
            type="button"
            className={`preset-chip ${backendType === 'none' ? 'active-preset' : ''}`}
            onClick={() => applyPreset('static')}
          >
            <span style={{ fontSize: '1.1rem' }}>🌐</span>
            <div>
              <div style={{ fontWeight: 700 }}>Static Website</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>HTML5 / CSS3 / Nginx</div>
            </div>
          </button>
        </div>
      </div>

      {/* 3-Tier Customization Selectors Grid */}
      <div className="tier-container-box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 250px), 1fr))', gap: '0.85rem' }}>
          {/* Tier 1: Frontend */}
          <div className="tier-card">
            <div className="tier-badge frontend">
              <Layout size={15} />
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Served via Nginx Port 80 with Reverse Proxy
            </div>
          </div>

          {/* Tier 2: Backend */}
          <div className="tier-card">
            <div className="tier-badge backend">
              <Server size={15} />
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Systemd daemon with automated /api/health probes
            </div>
          </div>

          {/* Tier 3: Database */}
          <div className="tier-card">
            <div className="tier-badge database">
              <Database size={15} />
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
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.4rem' }}>
              Bound to 127.0.0.1, auto-migration schema
            </div>
          </div>
        </div>
      </div>

      {/* Live Architecture Flow Banner */}
      <div className="topology-flow-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
          <Layers size={16} color="var(--aws-blue)" style={{ flexShrink: 0 }} />
          <span>
            <strong>Active Topology:</strong> User ➔ Nginx (Port 80) ➔ ProxyPass /api/ ➔ <span style={{ color: 'var(--aws-orange)', fontWeight: 700 }}>{backendType.toUpperCase()} ({getBackendPort()})</span> ➔ <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{databaseType.toUpperCase()}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowEditor(!showEditor)}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem', minHeight: '32px' }}
          >
            <Code2 size={13} />
            <span>{showEditor ? 'Hide Editor' : 'Edit Website / HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Code Editor */}
      {showEditor && (
        <div className="code-editor-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Source File: <code>ansible/roles/webapp/files/app/index.html</code>
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.76rem', padding: '0.25rem 0.6rem', minHeight: '30px', textDecoration: 'none' }}>
                <Eye size={12} />
                <span>Preview</span>
              </a>
              <button type="button" className="btn-primary" onClick={handleSaveHtml} style={{ fontSize: '0.76rem', padding: '0.25rem 0.75rem', minHeight: '30px' }}>
                {isSaved ? <Check size={13} color="#FFFFFF" /> : <Save size={13} />}
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
              background: '#090D16',
              color: '#38BDF8',
              fontFamily: "'JetBrains Mono', Consolas, monospace",
              fontSize: '0.82rem',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.75rem',
              outline: 'none',
              resize: 'vertical',
              lineHeight: 1.5
            }}
          />
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', flexWrap: 'wrap' }}>
        <button
          className="btn-primary"
          style={{ flex: '1 1 260px', background: 'var(--accent-ansible)', color: '#FFFFFF', border: '1px solid var(--accent-ansible)' }}
          onClick={() => onDeploy(selectedServer, frontendType, backendType, databaseType)}
          disabled={isRunning || !isInfraReady}
        >
          <Play size={15} />
          <span>Deploy Full-Stack Application (Ansible Playbook)</span>
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
