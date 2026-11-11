import React, { useState, useEffect, useRef } from 'react';
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
  UploadCloud,
  FolderArchive,
  FileArchive,
  Trash2,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { CircularLoader } from './CircularLoader';
import { DeploymentState, InfrastructureState, StackConfig, CustomCodeState } from '../types';
import { fetchWebappContent, saveWebappContent, uploadCustomCode, clearUploadedCode } from '../services/api';

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
  customCode,
  onDeploy,
  isRunning,
  onRefreshStatus,
}) => {
  const [selectedServer] = useState<'nginx' | 'apache'>('nginx');
  
  // 3-Tier Stack Selection State
  const [frontendType, setFrontendType] = useState<string>('react');
  const [backendType, setBackendType] = useState<string>('python');
  const [databaseType, setDatabaseType] = useState<string>('postgresql');
  
  // Panes toggle: 'upload' | 'editor' | null
  const [showUpload, setShowUpload] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  // Upload Management State
  const [uploadTier, setUploadTier] = useState<'backend' | 'frontend'>('frontend');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFileList, setShowFileList] = useState(false);

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HTML Editor State
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

  const getBackendPort = () => {
    if (backendType === 'java_springboot') return 8080;
    if (backendType === 'nodejs') return 5000;
    if (backendType === 'python') return 8000;
    if (backendType === 'docker') return 8000;
    return 0;
  };

  const getBackendFramework = (type: string): string => {
    if (type === 'java_springboot') return 'springboot';
    if (type === 'nodejs') return 'nodejs';
    if (type === 'python') return 'python';
    return 'docker';
  };

  const getBackendLabel = (type: string) => {
    if (type === 'java_springboot') return 'Spring Boot';
    if (type === 'nodejs') return 'Node.js Express';
    if (type === 'python') return 'Python FastAPI';
    if (type === 'docker') return 'Universal Docker';
    return 'Custom Service';
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

  // Handle uploading files list
  const uploadFileList = async (files: File[]) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const effectiveFramework = uploadTier === 'frontend'
      ? (frontendType === 'html' ? 'html' : 'react')
      : getBackendFramework(backendType);

    try {
      const formData = new FormData();
      formData.append('target_tier', uploadTier);
      formData.append('framework', effectiveFramework);

      const paths: string[] = [];
      files.forEach((f) => {
        formData.append('files', f);
        // webkitRelativePath contains e.g. "my-project/src/index.js"
        const p = (f as any).webkitRelativePath || f.name;
        paths.push(p);
      });
      formData.append('paths', JSON.stringify(paths));

      const res = await uploadCustomCode(formData);
      if (res.has_dockerfile) {
        setBackendType('docker');
        setUploadSuccess(`🐳 Dockerfile Auto-Detected! Switched to Universal Docker container. Uploaded ${res.file_count} files!`);
      } else {
        const targetName = uploadTier === 'backend' ? getBackendLabel(backendType) : getFrontendLabel(frontendType);
        setUploadSuccess(`Successfully uploaded ${res.file_count} files for ${targetName}!`);
      }
      if (onRefreshStatus) onRefreshStatus();
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload code package');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFileList(Array.from(files));
    e.target.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFileList(Array.from(files));
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await uploadFileList(Array.from(e.dataTransfer.files));
    }
  };

  const handleClearCode = async (tier: 'frontend' | 'backend') => {
    try {
      await clearUploadedCode(tier);
      if (onRefreshStatus) onRefreshStatus();
    } catch (err: any) {
      console.error(err);
    }
  };

  const hasBackendCustom = !!customCode?.backend;
  const hasFrontendCustom = !!customCode?.frontend;
  const hasCustomCode = hasBackendCustom || hasFrontendCustom;

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
            {hasCustomCode && (
              <span className="upload-badge-indicator" title="Custom User Code Ready">
                {customCode?.backend?.has_dockerfile ? '🐳 Dockerfile Auto-Detected' : '✓ Custom Code'}
              </span>
            )}
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
        {isRunning && (
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
                {hasFrontendCustom && <span className="upload-badge-indicator" style={{ marginLeft: 'auto' }}>Custom</span>}
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
                {hasBackendCustom && (
                  <span className="upload-badge-indicator" style={{ marginLeft: 'auto' }}>
                    {customCode?.backend?.has_dockerfile ? '🐳 Dockerfile' : 'Custom'}
                  </span>
                )}
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
              <strong>Topology:</strong> Nginx (80) ➔ /api/ ➔ <span style={{ color: 'var(--aws-orange)', fontWeight: 700 }}>{backendType.toUpperCase()} ({getBackendPort()})</span> ➔ <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>{databaseType.toUpperCase()}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            {/* Custom Code Upload Button */}
            <button
              type="button"
              className={`btn-secondary ${showUpload ? 'active-upload-btn' : ''}`}
              onClick={() => {
                setShowUpload(!showUpload);
                if (!showUpload) setShowEditor(false);
              }}
              style={{ fontSize: '0.76rem', padding: '0 0.65rem', height: '30px' }}
              title="Upload project folder, .zip, or .jar"
            >
              <UploadCloud size={13} color="var(--aws-orange)" />
              <span>{showUpload ? 'Hide Uploader' : 'Upload Project (Folder / Zip)'}</span>
              {hasCustomCode && <span className="upload-badge-indicator">Active</span>}
            </button>

            {/* Quick HTML Editor Button */}
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowEditor(!showEditor);
                if (!showEditor) setShowUpload(false);
              }}
              style={{ fontSize: '0.76rem', padding: '0 0.65rem', height: '30px' }}
            >
              <Code2 size={13} />
              <span>{showEditor ? 'Hide Code' : 'Edit HTML'}</span>
            </button>
          </div>
        </div>

        {/* ===================================================================
            POLYGLOT CODE UPLOAD MANAGER (Node, Spring Boot, Python, React)
            =================================================================== */}
        {showUpload && (
          <div className="upload-container-box">
            {/* Hidden Input Triggers */}
            <input
              ref={folderInputRef}
              type="file"
              // @ts-ignore
              webkitdirectory=""
              directory=""
              multiple
              style={{ display: 'none' }}
              onChange={handleFolderUpload}
            />
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".zip,.jar,.tar,.gz,.js,.ts,.py,.java,.json,.xml,.html,.css,Dockerfile,dockerfile"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            <div className="upload-header-row">
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Upload Custom Code Package
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                  Deploy custom source files, directory, or archive for the selected architecture tier.
                </div>
              </div>
            </div>

            {/* Target Tier Selector (Backend vs Frontend) */}
            <div className="upload-framework-selector">
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', marginRight: '0.2rem' }}>
                Target Tier:
              </span>
              <button
                type="button"
                className={`upload-framework-btn ${uploadTier === 'backend' ? 'active' : ''}`}
                onClick={() => setUploadTier('backend')}
              >
                <Server size={13} color={uploadTier === 'backend' ? 'var(--aws-orange)' : 'var(--text-dim)'} />
                <span>Backend Service</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                  ({getBackendLabel(backendType)})
                </span>
              </button>

              <button
                type="button"
                className={`upload-framework-btn ${uploadTier === 'frontend' ? 'active' : ''}`}
                onClick={() => setUploadTier('frontend')}
              >
                <Layout size={13} color={uploadTier === 'frontend' ? 'var(--aws-orange)' : 'var(--text-dim)'} />
                <span>Frontend UI</span>
                <span style={{ fontSize: '0.68rem', opacity: 0.85, fontWeight: 500 }}>
                  ({getFrontendLabel(frontendType)})
                </span>
              </button>

              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                🐳 Dockerfile auto-detected on upload
              </span>
            </div>

            {/* Upload Action Zone & Drag-and-Drop */}
            <div
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-actions-grid">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => folderInputRef.current?.click()}
                  disabled={isUploading}
                  style={{ background: 'var(--aws-blue)', border: '1px solid var(--aws-blue)' }}
                >
                  <FolderArchive size={14} />
                  <span>Upload Entire Folder</span>
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <FileArchive size={14} />
                  <span>Upload Files / .zip / .jar</span>
                </button>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                or drag and drop your project folder, <code>.zip</code>, or <code>.jar</code> here
              </div>
              {uploadTier === 'frontend' && (
                <div style={{ marginTop: '0.35rem', fontSize: '0.72rem', color: 'var(--aws-orange)' }}>
                  💡 <strong>React Portfolio Tip:</strong> Upload the compiled <code>dist/</code> or <code>build/</code> folder (run <code>npm run build</code> first).
                </div>
              )}

              {isUploading && (
                <div style={{ marginTop: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', color: 'var(--aws-orange)', fontSize: '0.78rem', fontWeight: 600 }}>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Uploading and packaging {uploadTier === 'backend' ? getBackendLabel(backendType) : getFrontendLabel(frontendType)}...</span>
                </div>
              )}
            </div>

            {/* Success / Error Messages */}
            {uploadSuccess && (
              <div style={{ marginTop: '0.65rem', padding: '0.55rem 0.75rem', background: 'var(--status-success-bg)', border: '1px solid var(--status-success)', borderRadius: '5px', fontSize: '0.76rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Check size={14} />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {uploadError && (
              <div style={{ marginTop: '0.65rem', padding: '0.55rem 0.75rem', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid var(--status-danger)', borderRadius: '5px', fontSize: '0.76rem', color: '#F87171', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <AlertCircle size={14} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Currently Active Uploaded Packages */}
            {customCode?.backend && (
              <div className="uploaded-package-pill">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Server size={16} color="var(--aws-orange)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Backend Package: {customCode.backend.framework.toUpperCase()}
                      <span className="upload-badge-indicator">Active</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {customCode.backend.file_count} files • {Math.round(customCode.backend.total_size_bytes / 1024)} KB • Uploaded: {customCode.backend.uploaded_at}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowFileList(!showFileList)}
                    style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem' }}
                  >
                    <span>{showFileList ? 'Hide Files' : 'View Files'}</span>
                    {showFileList ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>

                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleClearCode('backend')}
                    style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem', color: 'var(--status-danger)' }}
                    title="Remove custom code and revert to default template"
                  >
                    <Trash2 size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                {showFileList && customCode.backend.files && (
                  <div className="file-tree-preview" style={{ width: '100%' }}>
                    {customCode.backend.files.map((file, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.1rem 0' }}>
                        <FileText size={11} color="var(--aws-orange)" />
                        <span>{file}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {customCode?.frontend && (
              <div className="uploaded-package-pill">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <Layout size={16} color="var(--aws-blue)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      Frontend Package: {customCode.frontend.framework.toUpperCase()}
                      <span className="upload-badge-indicator">Active</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {customCode.frontend.file_count} files • {Math.round(customCode.frontend.total_size_bytes / 1024)} KB • Uploaded: {customCode.frontend.uploaded_at}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleClearCode('frontend')}
                  style={{ fontSize: '0.72rem', height: '26px', padding: '0 0.5rem', color: 'var(--status-danger)' }}
                >
                  <Trash2 size={12} />
                  <span>Reset</span>
                </button>
              </div>
            )}

            {/* Quick Framework Guidance */}
            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '5px', fontSize: '0.73rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>
              <strong>Deployment Instructions:</strong>
              <ul style={{ paddingLeft: '1.15rem', marginTop: '0.25rem' }}>
                <li><strong>Node.js:</strong> Upload folder or <code>.zip</code> containing <code>package.json</code> & <code>server.js</code>. Ansible installs dependencies via <code>npm install</code>.</li>
                <li><strong>Spring Boot:</strong> Upload compiled <code>app.jar</code> (or zip with executable jar). Ansible runs it under OpenJDK 17.</li>
                <li><strong>Python:</strong> Upload folder with <code>app.py</code> and optional <code>requirements.txt</code>.</li>
                <li><strong>Frontend:</strong> Upload your React production <code>dist</code> folder or static HTML/CSS/JS.</li>
              </ul>
            </div>
          </div>
        )}

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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--aws-orange)',
                  textDecoration: 'none'
                }}
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
          className={`btn-primary ${isRunning ? 'is-running' : ''}`}
          style={{ flex: '1 1 240px', background: 'var(--accent-ansible)', color: '#FFFFFF', border: '1px solid var(--accent-ansible)' }}
          onClick={() => onDeploy(selectedServer, frontendType, backendType, databaseType)}
          disabled={isRunning || !isInfraReady}
        >
          {isRunning ? (
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
