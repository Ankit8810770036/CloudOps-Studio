import React, { useState, useEffect } from 'react';
import { Package, Play, ExternalLink, Code2, Save, Eye, Check, RefreshCw } from 'lucide-react';
import { DeploymentState, InfrastructureState } from '../types';
import { fetchWebappContent, saveWebappContent } from '../services/api';

interface AnsibleStepProps {
  deployment: DeploymentState;
  infra: InfrastructureState;
  onDeploy: (webServer: 'nginx' | 'apache') => void;
  isRunning: boolean;
}

const TEMPLATES: Record<string, string> = {
  simple: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Simple DevOps HTML Website</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      text-align: center;
    }
    .card {
      background: #1e293b;
      padding: 2.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.4);
      max-width: 500px;
      border: 1px solid #334155;
    }
    h1 { color: #38bdf8; margin-bottom: 0.5rem; }
    p { color: #94a3b8; line-height: 1.6; }
    .badge {
      display: inline-block;
      background: #0284c7;
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: bold;
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>🚀 Hello from My DevOps Server!</h1>
    <p>This simple HTML website was automatically deployed onto AWS EC2 using <strong>Ansible</strong> & <strong>Nginx</strong>.</p>
    <div class="badge">Deployed via CloudOps Studio</div>
  </div>
</body>
</html>`,

  portfolio: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ankit Kumar Singh - DevOps Portfolio</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f3f4f6; margin: 0; padding: 2rem; }
    .container { max-width: 800px; margin: 0 auto; }
    header { border-bottom: 1px solid #1f2937; padding-bottom: 1.5rem; }
    h1 { color: #60a5fa; margin-bottom: 0.25rem; }
    .tagline { color: #9ca3af; font-size: 1.1rem; }
    .skills { display: flex; gap: 0.5rem; margin-top: 1rem; flex-wrap: wrap; }
    .skill { background: #1e293b; border: 1px solid #374151; padding: 0.4rem 0.8rem; border-radius: 6px; font-size: 0.85rem; }
    .section { margin-top: 2rem; }
    .project-card { background: #111827; border: 1px solid #1f2937; border-radius: 10px; padding: 1.25rem; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Ankit Kumar Singh</h1>
      <p class="tagline">Cloud & DevOps Engineer &bull; Automated Infrastructure Platform</p>
      <div class="skills">
        <span class="skill">Terraform</span>
        <span class="skill">Ansible</span>
        <span class="skill">Puppet</span>
        <span class="skill">Nagios Core</span>
        <span class="skill">AWS EC2</span>
        <span class="skill">Linux / Bash</span>
      </div>
    </header>
    <div class="section">
      <h2>Featured Class Project</h2>
      <div class="project-card">
        <h3>Automated Cloud Infrastructure & Configuration Management</h3>
        <p style="color: #9ca3af;">Fully automated platform provisioning EC2, deploying Nginx, enforcing Puppet compliance, and actively monitored by Nagios.</p>
      </div>
    </div>
  </div>
</body>
</html>`
};

export const AnsibleStep: React.FC<AnsibleStepProps> = ({
  deployment,
  infra,
  onDeploy,
  isRunning,
}) => {
  const [selectedServer, setSelectedServer] = useState<'nginx' | 'apache'>('nginx');
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

  const handleSelectTemplate = (key: 'simple' | 'portfolio') => {
    if (TEMPLATES[key]) {
      setHtmlCode(TEMPLATES[key]);
    }
  };

  // Preview link: if deployed and has app_url, or local preview
  const previewUrl = isDeployed && infra.app_url ? infra.app_url : 'http://127.0.0.1:8000/api/webapp/preview';

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
        Runs idempotent Ansible roles to install and configure the web server, deploy your HTML website assets to <code>/var/www/devops_app</code>, and verify HTTP 200 response.
      </p>

      {/* Web Server Choice */}
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

      {/* HTML Website Customizer Toggle */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '10px',
        padding: '0.85rem 1rem',
        marginBottom: '1.25rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#f8fafc' }}>
              HTML Website Content (Customizable)
            </div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              Stored in: <code>ansible/roles/webapp/files/app/index.html</code>
            </div>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowEditor(!showEditor)}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            <Code2 size={14} />
            <span>{showEditor ? 'Hide Editor' : 'Edit / Paste HTML Code'}</span>
          </button>
        </div>

        {showEditor && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Load Quick Template:</span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleSelectTemplate('simple')}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                Simple HTML
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => handleSelectTemplate('portfolio')}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                DevOps Portfolio
              </button>
            </div>

            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              rows={9}
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
              placeholder="Paste your HTML code here..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', textDecoration: 'none' }}
              >
                <Eye size={13} />
                <span>Preview in Browser</span>
              </a>

              <button
                type="button"
                className="btn-primary"
                onClick={handleSaveHtml}
                style={{ fontSize: '0.78rem', padding: '0.35rem 0.85rem' }}
              >
                {isSaved ? <Check size={14} color="#10b981" /> : <Save size={14} />}
                <span>{isSaved ? 'Saved to Playbook!' : 'Save HTML Code'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Spec Summary */}
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
          <span style={{ color: '#94a3b8' }}>Destination on Server:</span>
          <span style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>/var/www/devops_app/ (Port 80)</span>
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
