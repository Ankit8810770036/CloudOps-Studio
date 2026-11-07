import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  FileCode2,
  FolderX,
  Radio,
  HeartPulse,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Code2,
  ShieldCheck,
  FileText,
  ArrowRight
} from 'lucide-react';
import { CustomCodeState } from '../types';

interface PreDeploymentChecklistProps {
  backendType?: string;
  frontendType?: string;
  isInfraReady: boolean;
  hasCustomCode?: boolean;
  customCode?: CustomCodeState;
  onProceed?: () => void;
  proceedLabel?: string;
  defaultOpen?: boolean;
  titlePrefix?: string;
}

const STORAGE_KEY = 'cloudops_preflight_checks_v2';

export const PreDeploymentChecklist: React.FC<PreDeploymentChecklistProps> = React.memo(({
  backendType = 'python',
  frontendType = 'react',
  isInfraReady,
  hasCustomCode: _hasCustomCode,
  customCode: _customCode,
  onProceed,
  proceedLabel,
  defaultOpen = true,
  titlePrefix,
}) => {
  const getTargetTab = (bType: string, fType: string) => {
    if (bType === 'docker') return 'docker';
    if (bType === 'python') return 'python';
    if (bType === 'nodejs') return 'nodejs';
    if (bType === 'java_springboot') return 'springboot';
    if (fType === 'react') return 'react';
    if (fType === 'html') return 'html';
    return 'python';
  };

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [userSelectedTab, setUserSelectedTab] = useState<string | null>(null);
  const activeTab = userSelectedTab ?? getTargetTab(backendType, frontendType);
  const [copiedSample, setCopiedSample] = useState(false);
  const [showSampleSnippet, setShowSampleSnippet] = useState(false);

  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {
        manifest: false,
        cleanPackage: false,
        hostBinding: false,
        healthRoute: false,
      };
    } catch {
      return {
        manifest: false,
        cleanPackage: false,
        hostBinding: false,
        healthRoute: false,
      };
    }
  });

  const toggleCheck = (key: string) => {
    setCheckedItems(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
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
    docker: {
      title: 'Dockerfile',
      filename: 'Dockerfile',
      code: `# Multi-stage Universal Dockerfile (Supports Go, Rust, Ruby, PHP, Python, Node, .NET)
FROM alpine:latest
WORKDIR /app
COPY . .
EXPOSE 8000
CMD ["./app"]`
    },
    python: {
      title: 'requirements.txt',
      filename: 'requirements.txt',
      code: `fastapi>=0.110.0\nuvicorn[standard]>=0.28.0\nrequests>=2.31.0`
    },
    nodejs: {
      title: 'package.json',
      filename: 'package.json',
      code: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "scripts": { "start": "node server.js" },\n  "dependencies": { "express": "^4.19.2", "cors": "^2.8.5" }\n}`
    },
    springboot: {
      title: 'application.properties',
      filename: 'application.properties',
      code: `server.port=8080\nmanagement.endpoints.web.exposure.include=health`
    },
    react: {
      title: 'vite.config.ts',
      filename: 'vite.config.ts',
      code: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n  base: './',\n})`
    },
    html: {
      title: 'index.html',
      filename: 'index.html',
      code: `<!DOCTYPE html>\n<html>\n<head><title>App</title><link rel="stylesheet" href="./style.css"></head>\n<body><h1>Running</h1><script src="./app.js"></script></body>\n</html>`
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
      {/* Header Bar */}
      <div className="pre-deploy-header" onClick={() => setIsOpen(!isOpen)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="pre-deploy-icon-badge">
            <ShieldCheck size={16} />
          </div>
          <div>
            <div className="pre-deploy-title">
              <span>{titlePrefix ? `${titlePrefix} ` : ''}Pre-Deployment Checklist</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className={`pre-deploy-badge ${isAllReady ? 'ready' : 'pending'}`}>
            {isAllReady ? (
              <>
                <CheckCircle2 size={13} />
                <span>5/5 Verified</span>
              </>
            ) : (
              <>
                <AlertTriangle size={13} />
                <span>{completedCount}/{totalSteps} Verified</span>
              </>
            )}
          </div>
          <button
            type="button"
            className="pre-deploy-toggle-btn"
            title={isOpen ? "Collapse" : "Expand"}
          >
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="pre-deploy-body">
          {/* Framework Tabs */}
          <div className="pre-deploy-tabs">
            {[
              { id: 'docker', label: 'Universal (Dockerfile)', icon: '🐳' },
              { id: 'python', label: 'Python (FastAPI)', icon: '🐍' },
              { id: 'nodejs', label: 'Node.js (Express)', icon: '🟩' },
              { id: 'springboot', label: 'Spring Boot', icon: '☕' },
              { id: 'react', label: 'React SPA', icon: '⚛️' },
              { id: 'html', label: 'Static HTML', icon: '🌐' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`pre-deploy-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setUserSelectedTab(tab.id);
                  setShowSampleSnippet(false);
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Concise Rule Cards */}
          <div className="pre-deploy-requirements-grid">
            {activeTab === 'docker' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Manifest: Dockerfile</strong>
                  </div>
                  <p>Root file named <code>Dockerfile</code>. Supports Go, Rust, Ruby, PHP, Python, Node, .NET, or any language.</p>
                </div>
                <div className="req-card warning">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>2. Port: EXPOSE 8000</strong>
                  </div>
                  <p>Bind service to <code>0.0.0.0:8000</code> inside container for reverse proxy forwarding.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <FolderX size={14} color="var(--status-success)" />
                    <strong>3. Supervised Runtime</strong>
                  </div>
                  <p>Auto-runs <code>docker run -d --restart always -p 8000:8000</code> on target host.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>4. Health: /api/health</strong>
                  </div>
                  <p>Return HTTP 200 on <code>/api/health</code> for Nagios telemetry probes.</p>
                </div>
              </>
            )}

            {activeTab === 'python' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Manifest: requirements.txt</strong>
                  </div>
                  <p>Root file with packages (e.g. <code>fastapi</code>, <code>uvicorn</code>). Auto-installed in Linux venv.</p>
                </div>
                <div className="req-card warning">
                  <div className="req-card-header">
                    <FolderX size={14} color="var(--status-danger)" />
                    <strong>2. Exclude .venv/</strong>
                  </div>
                  <p>Do not upload local <code>.venv/</code>; server builds fresh environment.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>3. Port: 0.0.0.0:8000</strong>
                  </div>
                  <p>Bind host <code>0.0.0.0</code> on port <code>8000</code> for Nginx reverse proxy.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>4. Health: /api/health</strong>
                  </div>
                  <p>Return HTTP 200 on <code>/api/health</code> for Nagios telemetry.</p>
                </div>
              </>
            )}

            {activeTab === 'nodejs' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Manifest: package.json</strong>
                  </div>
                  <p>Must contain dependencies and a <code>"start": "node server.js"</code> script.</p>
                </div>
                <div className="req-card warning">
                  <div className="req-card-header">
                    <FolderX size={14} color="var(--status-danger)" />
                    <strong>2. Exclude node_modules/</strong>
                  </div>
                  <p>Do not upload <code>node_modules/</code>; installed cleanly on Ubuntu.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>3. Port: 0.0.0.0:5000</strong>
                  </div>
                  <p>Listen on <code>0.0.0.0:5000</code> for Nginx proxy forwarding.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>4. Health: /api/health</strong>
                  </div>
                  <p>Return HTTP 200 on <code>/api/health</code> for Nagios telemetry.</p>
                </div>
              </>
            )}

            {activeTab === 'springboot' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Executable: app.jar</strong>
                  </div>
                  <p>Build standalone JAR (<code>./mvnw clean package</code>) with embedded dependencies.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>2. Port: 8080</strong>
                  </div>
                  <p>Set <code>server.port=8080</code> in <code>application.properties</code>.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <HeartPulse size={14} color="var(--status-success)" />
                    <strong>3. Health Route</strong>
                  </div>
                  <p>Expose <code>/api/health</code> or Actuator <code>/actuator/health</code>.</p>
                </div>
              </>
            )}

            {activeTab === 'react' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Build Output: dist/</strong>
                  </div>
                  <p>Run <code>npm run build</code> and upload the generated <code>dist/</code> folder.</p>
                </div>
                <div className="req-card">
                  <div className="req-card-header">
                    <Radio size={14} color="var(--aws-blue)" />
                    <strong>2. Base Path: base: './'</strong>
                  </div>
                  <p>Set relative base in <code>vite.config.ts</code> for clean asset loading.</p>
                </div>
              </>
            )}

            {activeTab === 'html' && (
              <>
                <div className="req-card highlight">
                  <div className="req-card-header">
                    <FileCode2 size={14} color="var(--aws-orange)" />
                    <strong>1. Entry Point: index.html</strong>
                  </div>
                  <p>Root HTML file named <code>index.html</code> with relative CSS/JS paths.</p>
                </div>
              </>
            )}
          </div>

          {/* Interactive Checklist */}
          <div className="checklist-container">
            <div className="checklist-title-row">
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pre-Flight Checks (Click to Confirm)
              </span>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowSampleSnippet(!showSampleSnippet)}
                style={{ fontSize: '0.72rem', height: '24px', padding: '0 0.5rem' }}
              >
                <Code2 size={12} />
                <span>{showSampleSnippet ? 'Hide' : `Template: ${currentSample.filename}`}</span>
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
                    Step 1: Cloud Infrastructure
                  </div>
                  <div className="checklist-item-desc">
                    {isInfraReady ? 'VPC & EC2 instance ready.' : 'Pending: Run Step 1 (Terraform IaC) first.'}
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
                    Dependency Manifest Included
                  </div>
                  <div className="checklist-item-desc">
                    Root {activeTab === 'python' ? 'requirements.txt' : activeTab === 'nodejs' ? 'package.json' : activeTab === 'springboot' ? 'app.jar' : 'index.html'} present.
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
                    No .venv/ or node_modules/ in upload.
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
                    Host Binding (0.0.0.0)
                  </div>
                  <div className="checklist-item-desc">
                    Listens on 0.0.0.0 on port {activeTab === 'python' ? '8000' : activeTab === 'nodejs' ? '5000' : activeTab === 'springboot' ? '8080' : '80'}.
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
                    Health Check (/api/health)
                  </div>
                  <div className="checklist-item-desc">
                    Returns HTTP 200 for Nagios telemetry.
                  </div>
                </div>
              </div>
            </div>

            {/* Template Snippet */}
            {showSampleSnippet && (
              <div className="sample-snippet-box">
                <div className="sample-snippet-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    <FileText size={13} color="var(--aws-orange)" />
                    <span>Starter: <code>{currentSample.filename}</code></span>
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleCopySample(currentSample.code)}
                    style={{ fontSize: '0.7rem', height: '22px', padding: '0 0.45rem' }}
                  >
                    {copiedSample ? <Check size={11} color="var(--status-success)" /> : <Copy size={11} />}
                    <span>{copiedSample ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="sample-snippet-code">
                  <code>{currentSample.code}</code>
                </pre>
              </div>
            )}

            {/* Proceed Button */}
            {onProceed && (
              <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={onProceed}
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.45rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontWeight: 700
                  }}
                >
                  <span>{proceedLabel || 'Proceed to Step 1 ➔'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
