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
  const [selectedServer, setSelectedServer] = useState<'nginx' | 'apache'>('nginx');
  
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
      <div className="panel-header">
        <h3>
          <Package size={20} color="#f87171" />
          <span>Step 2: Full-Stack Polyglot Deployment (Frontend &bull; Backend &bull; Database)</span>
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
        Ansible automatically provisions and configures your entire application architecture. Select or mix any Frontend (React / HTML), Backend API runtime (Python / Java Spring Boot / Node.js), and Database tier (PostgreSQL / MySQL / MongoDB / SQLite).
      </p>

      {/* Quick Architecture Presets */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8', marginBottom: '0.5rem' }}>
          <Sparkles size={14} />
          <span>Popular 1-Click Architecture Presets:</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => applyPreset('python')}
            style={{
              justifyContent: 'center',
              border: backendType === 'python' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
              background: backendType === 'python' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(255, 255, 255, 0.03)'
            }}
          >
            🐍 Python Full-Stack (React + FastAPI + Postgres)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => applyPreset('spring')}
            style={{
              justifyContent: 'center',
              border: backendType === 'java_springboot' ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
              background: backendType === 'java_springboot' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255, 255, 255, 0.03)'
            }}
          >
            ☕ Enterprise Java (React + Spring Boot + MySQL)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => applyPreset('mern')}
            style={{
              justifyContent: 'center',
              border: backendType === 'nodejs' ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
              background: backendType === 'nodejs' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)'
            }}
          >
            🟢 MERN Stack (React + Node.js + MongoDB)
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => applyPreset('static')}
            style={{
              justifyContent: 'center',
              border: backendType === 'none' ? '1px solid #c084fc' : '1px solid rgba(255, 255, 255, 0.08)',
              background: backendType === 'none' ? 'rgba(192, 132, 252, 0.1)' : 'rgba(255, 255, 255, 0.03)'
            }}
          >
            🌐 Static Website (HTML5 / Nginx)
          </button>
        </div>
      </div>

      {/* 3-Tier Customization Selectors */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1rem',
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.25rem'
      }}>
        {/* Tier 1: Frontend */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#60a5fa', marginBottom: '0.6rem' }}>
            <Layout size={16} />
            <span>1. Frontend Tier</span>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <select
              className="form-select"
              value={frontendType}
              onChange={(e) => setFrontendType(e.target.value)}
              disabled={isRunning}
            >
              <option value="react">React Modern SPA (Vite + Tailwind)</option>
              <option value="html">Static HTML5 / CSS3 / JavaScript</option>
              <option value="nodejs_ssr">Node.js / Express Server-Rendered UI</option>
            </select>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Served via Nginx Port 80 with Reverse Proxy
          </div>
        </div>

        {/* Tier 2: Backend */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#f59e0b', marginBottom: '0.6rem' }}>
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
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Systemd managed daemon with /api/health probes
          </div>
        </div>

        {/* Tier 3: Database */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#34d399', marginBottom: '0.6rem' }}>
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
              <option value="none">None (Stateless Cache)</option>
            </select>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.4rem' }}>
            Isolated on 127.0.0.1, automated schema initialization
          </div>
        </div>
      </div>

      {/* Live Architecture Flow Banner */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#cbd5e1' }}>
          <Layers size={16} color="#38bdf8" />
          <span><strong>Active Topology:</strong> User ➔ Nginx (Port 80) ➔ ProxyPass /api/ ➔ {backendType.toUpperCase()} ({getBackendPort()}) ➔ {databaseType.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowEditor(!showEditor)}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem' }}
          >
            <Code2 size={13} />
            <span>{showEditor ? 'Hide Code Editor' : 'Edit Website / HTML Code'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Code Editor */}
      {showEditor && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '10px',
          padding: '1rem',
          marginBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Edit Frontend Source Code (<code>ansible/roles/webapp/files/app/index.html</code>)
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', textDecoration: 'none' }}>
                <Eye size={12} />
                <span>Preview</span>
              </a>
              <button type="button" className="btn-primary" onClick={handleSaveHtml} style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
                {isSaved ? <Check size={13} color="#10b981" /> : <Save size={13} />}
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
              background: '#030712',
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              padding: '0.75rem',
              outline: 'none',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Action Footer */}
      <div style={{ display: 'flex', gap: '0.85rem', marginTop: 'auto' }}>
        <button
          className="btn-primary"
          style={{ flex: 1, background: 'linear-gradient(135deg, #ee0000 0%, #ea580c 100%)' }}
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
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8' }}
        >
          <span>{isDeployed ? 'Open App' : 'Preview Site'}</span>
          <ExternalLink size={14} />
        </a>
      </div>
    </div>
  );
};
