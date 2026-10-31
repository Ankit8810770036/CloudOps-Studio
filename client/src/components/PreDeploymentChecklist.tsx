import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  FolderX,
  Radio,
  HeartPulse,
  Server,
  Layers,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  Info,
  ShieldCheck,
  Terminal,
  FileText
} from 'lucide-react';
import { CustomCodeState } from '../types';

interface PreDeploymentChecklistProps {
  backendType: string;
  frontendType: string;
  isInfraReady: boolean;
  hasCustomCode: boolean;
  customCode?: CustomCodeState;
}

export const PreDeploymentChecklist: React.FC<PreDeploymentChecklistProps> = React.memo(({
  backendType,
  frontendType,
  isInfraReady,
  hasCustomCode,
  customCode,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('python');
  const [copiedSample, setCopiedSample] = useState(false);
  const [showSampleSnippet, setShowSampleSnippet] = useState(false);

  // Manual checklist states saved in session
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({
    manifest: false,
    cleanPackage: false,
    hostBinding: false,
    healthRoute: false,
  });

  // Sync active framework tab with user selections
  useEffect(() => {
    if (backendType === 'python') setActiveTab('python');
    else if (backendType === 'nodejs') setActiveTab('nodejs');
    else if (backendType === 'java_springboot') setActiveTab('springboot');
    else if (frontendType === 'react') setActiveTab('react');
    else if (frontendType === 'html') setActiveTab('html');
  }, [backendType, frontendType]);

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount =
    (isInfraReady ? 1 : 0) +
    (checkedItems.manifest ? 1 : 0) +
    (checkedItems.cleanPackage ? 1 : 0) +
    (checkedItems.hostBinding ? 1 : 0) +
    (checkedItems.healthRoute ? 1 : 0);

  const totalSteps = 5;
  const isAllReady = completedCount === totalSteps;

  const sampleManifests: { [key: string]: { title: string; filename: string; code: string } } = {
    python: {
      title: 'Python Requirements Manifest',
      filename: 'requirements.txt',
      code: `fastapi>=0.110.0
uvicorn[standard]>=0.28.0
pydantic>=2.6.0
requests>=2.31.0
psycopg2-binary>=2.9.9`
    },
    nodejs: {
      title: 'Node.js Package Manifest',
      filename: 'package.json',
      code: `{
  "name": "my-express-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5"
  }
}`
    },
    springboot: {
      title: 'Spring Boot Application Config',
      filename: 'application.properties',
      code: `server.port=8080
spring.application.name=cloudops-springboot-backend
management.endpoints.web.exposure.include=health,info`
    },
    react: {
      title: 'Vite React Relative Base Config',
      filename: 'vite.config.ts',
      code: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Relative base path ensures assets load cleanly on Nginx subpaths
export default defineConfig({
  plugins: [react()],
  base: './',
})`
    },
    html: {
      title: 'Static HTML5 Entry Point',
      filename: 'index.html',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>My Cloud App</title>
  <link rel="stylesheet" href="./style.css" />
</head>
<body>
  <h1>App Deployed via DevOps Platform</h1>
  <script src="./app.js"></script>
</body>
</html>`
    }
  };

  const handleCopySample = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSample(true);
    setTimeout(() => setCopiedSample(false), 2000);
  };

  const currentSample = sampleManifests[activeTab] || sampleManifests.python;

  return (
    <div className="pre-deploy-box">
      {/* 1. Header Bar */}
      <div className="pre-deploy-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="pre-deploy-icon-badge">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="pre-deploy-title">
              <span>Pre-Deployment Readiness Checklist & Required Files</span>
            </div>
            <div className="pre-deploy-sub">
              Required manifest files, port bindings, and exclude rules to verify before deploying code.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className={`pre-deploy-badge ${isAllReady ? 'ready' : 'pending'}`}>
            {isAllReady ? (
              <>
                <CheckCircle2 size={13} />
                <span>5/5 All Checks Passed</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} />
                <span>{completedCount}/{totalSteps} Steps Verified</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="pre-deploy-toggle-btn"
            title={isOpen ? "Collapse Checklist" : "Expand Checklist"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="pre-deploy-body">
          {/* 2. Interactive Framework Instruction Tabs */}
          <div className="pre-deploy-tabs">
            {[
              { id: 'python', label: 'Python (FastAPI / Flask)', icon: '🐍' },
              { id: 'nodejs', label: 'Node.js (Express)', icon: '🟩' },
              { id: 'springboot', label: 'Java (Spring Boot)', icon: '☕' },
              { id: 'react', label: 'React SPA (Vite/CRA)', icon: '⚛️' },
              { id: 'html', label: 'Static HTML5', icon: '🌐' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`pre-deploy-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setShowSampleSnippet(false);
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* 3. Detailed Framework File Requirements */}
          <div className="pre-deploy-requirements-grid">
            {activeTab === 'python' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Dependency Manifest: requirements.txt</strong>
                  </div>
                  <p>
                    Must be at the root of your project folder. List all packages (e.g. <code>fastapi</code>, <code>uvicorn</code>, <code>requests</code>). The orchestrator runs <code>pip install -r requirements.txt</code> inside an isolated virtual environment.
                  </p>
                </div>

                <div className="req-card warning">
                  <div className="req-card-header">
                    <FolderX size={14} color="var(--status-danger)" />
                    <strong>2. DO NOT Upload .venv or __pycache__</strong>
                  </div>
                  <p>
                    Delete or exclude your local <code>.venv/</code> or <code>env/</code> folder before upload. Virtual environments contain OS-specific binaries. The server builds a fresh Linux venv automatically.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>3. Port & Host Binding: 0.0.0.0:8000</strong>
                  </div>
                  <p>
                    Ensure your app binds to <code>host="0.0.0.0"</code> and <code>port=8000</code> so the Nginx reverse proxy can forward web traffic to your backend.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>4. Health Route: /api/health</strong>
                  </div>
                  <p>
                    Provide a route returning HTTP 200 (e.g. <code>@app.get("/api/health")</code>). Nagios telemetry probes this endpoint every 4 seconds.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'nodejs' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Dependency Manifest: package.json</strong>
                  </div>
                  <p>
                    Must include your dependencies (e.g. <code>express</code>, <code>cors</code>) and a <code>"start": "node server.js"</code> script. The orchestrator runs <code>npm install --production</code> on the host.
                  </p>
                </div>

                <div className="req-card warning">
                  <div className="req-card-header">
                    <FolderX size={14} color="var(--status-danger)" />
                    <strong>2. DO NOT Upload node_modules</strong>
                  </div>
                  <p>
                    Delete or exclude <code>node_modules/</code> before uploading. It is huge, slows upload speeds, and contains platform-dependent binaries. The platform will install them cleanly on Ubuntu.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>3. Port & Host Binding: 0.0.0.0:5000</strong>
                  </div>
                  <p>
                    Configure Express to listen on <code>app.listen(5000, '0.0.0.0')</code> to connect with the Nginx proxy layer.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>4. Health Route: /api/health</strong>
                  </div>
                  <p>
                    Implement <code>{'app.get("/api/health", (req, res) => res.json({ status: "UP" }))'}</code> for Nagios telemetry monitoring.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'springboot' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Standalone Executable JAR (app.jar)</strong>
                  </div>
                  <p>
                    Run <code>./mvnw clean package</code> locally and upload the resulting <code>.jar</code> file. Spring Boot packages all dependencies inside <code>BOOT-INF/lib/</code>, guaranteeing zero missing libraries.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>2. Port Binding: server.port=8080</strong>
                  </div>
                  <p>
                    Configure <code>server.port=8080</code> in your <code>application.properties</code> or <code>application.yml</code>.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>3. Health Endpoint: /api/health or Actuator</strong>
                  </div>
                  <p>
                    Provide <code>/api/health</code> or enable Spring Boot Actuator at <code>/actuator/health</code>.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'react' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Upload Production Build (dist/ or build/)</strong>
                  </div>
                  <p>
                    Run <code>npm run build</code> locally and upload the contents of your <code>dist/</code> folder containing <code>index.html</code> and bundled CSS/JS. Nginx will serve these files directly.
                  </p>
                </div>

                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>2. Use Relative Asset Base (base: './')</strong>
                  </div>
                  <p>
                    In your <code>vite.config.ts</code>, set <code>base: './'</code> so assets load properly behind the web server without root-domain path conflicts.
                  </p>
                </div>
              </>
            )}

            {activeTab === 'html' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Root index.html Entry Point</strong>
                  </div>
                  <p>
                    Ensure your root HTML file is named exactly <code>index.html</code> with relative references to CSS and JS files (e.g. <code>./style.css</code>).
                  </p>
                </div>
              </>
            )}
          </div>

          {/* 4. Interactive Pre-Flight Checklist */}
          <div className="checklist-container">
            <div className="checklist-title-row">
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pre-Flight Checklist (Click to Confirm)
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSampleSnippet(!showSampleSnippet)}
                style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.55rem' }}
              >
                <Code2 size={12} />
                <span>{showSampleSnippet ? 'Hide Template' : `View ${currentSample.filename}`}</span>
              </button>
            </div>

            <div className="checklist-grid">
              {/* Check 1: Infra */}
              <div className={`checklist-item ${isInfraReady ? 'done' : 'fail'}`}>
                <div className="checklist-check-icon">
                  {isInfraReady ? <Check size={12} strokeWidth={3} /> : <AlertTriangle size={12} />}
                </div>
                <div className="checklist-content">
                  <div className="checklist-item-title">
                    Step 1: Cloud Infrastructure Ready
                  </div>
                  <div className="checklist-item-desc">
                    {isInfraReady ? 'VPC & EC2 instance provisioned and accessible.' : 'Pending: Please run Step 1 (Terraform IaC) first.'}
                  </div>
                </div>
              </div>

              {/* Check 2: Manifest */}
              <div
                className={`checklist-item clickable ${checkedItems.manifest ? 'done' : ''}`}
                onClick={() => toggleCheck('manifest')}
              >
                <div className="checklist-check-icon">
                  {checkedItems.manifest ? <Check size={12} strokeWidth={3} /> : <div className="empty-dot" />}
                </div>
                <div className="checklist-content">
                  <div className="checklist-item-title">
                    Dependency Manifest Included ({activeTab === 'python' ? 'requirements.txt' : activeTab === 'nodejs' ? 'package.json' : activeTab === 'springboot' ? 'app.jar' : 'index.html'})
                  </div>
                  <div className="checklist-item-desc">
                    Project includes required library and package declarations.
                  </div>
                </div>
              </div>

              {/* Check 3: Clean Package */}
              <div
                className={`checklist-item clickable ${checkedItems.cleanPackage ? 'done' : ''}`}
                onClick={() => toggleCheck('cleanPackage')}
              >
                <div className="checklist-check-icon">
                  {checkedItems.cleanPackage ? <Check size={12} strokeWidth={3} /> : <div className="empty-dot" />}
                </div>
                <div className="checklist-content">
                  <div className="checklist-item-title">
                    Heavy Local Folders Excluded
                  </div>
                  <div className="checklist-item-desc">
                    No .venv, node_modules, or .git included in upload package.
                  </div>
                </div>
              </div>

              {/* Check 4: Host Binding */}
              <div
                className={`checklist-item clickable ${checkedItems.hostBinding ? 'done' : ''}`}
                onClick={() => toggleCheck('hostBinding')}
              >
                <div className="checklist-check-icon">
                  {checkedItems.hostBinding ? <Check size={12} strokeWidth={3} /> : <div className="empty-dot" />}
                </div>
                <div className="checklist-content">
                  <div className="checklist-item-title">
                    Network Binding (0.0.0.0 on Target Port)
                  </div>
                  <div className="checklist-item-desc">
                    Application listens on 0.0.0.0 (Port {activeTab === 'python' ? '8000' : activeTab === 'nodejs' ? '5000' : activeTab === 'springboot' ? '8080' : '80'}).
                  </div>
                </div>
              </div>

              {/* Check 5: Health Route */}
              <div
                className={`checklist-item clickable ${checkedItems.healthRoute ? 'done' : ''}`}
                onClick={() => toggleCheck('healthRoute')}
              >
                <div className="checklist-check-icon">
                  {checkedItems.healthRoute ? <Check size={12} strokeWidth={3} /> : <div className="empty-dot" />}
                </div>
                <div className="checklist-content">
                  <div className="checklist-item-title">
                    Health Check Endpoint (/api/health)
                  </div>
                  <div className="checklist-item-desc">
                    Returns HTTP 200 for Nagios telemetry and service checks.
                  </div>
                </div>
              </div>
            </div>

            {/* Starter Manifest Code Snippet Box */}
            {showSampleSnippet && (
              <div className="sample-snippet-box">
                <div className="sample-snippet-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <FileText size={13} color="var(--aws-orange)" />
                    <span>Starter Template: <code>{currentSample.filename}</code></span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopySample(currentSample.code)}
                    style={{ fontSize: '0.7rem', height: '24px', padding: '0 0.45rem' }}
                  >
                    {copiedSample ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
                    <span>{copiedSample ? 'Copied!' : 'Copy Template'}</span>
                  </button>
                </div>
                <pre className="sample-snippet-code">
                  <code>{currentSample.code}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
