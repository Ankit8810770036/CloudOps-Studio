import React, { useState, useRef, useEffect } from 'react';
import {
  Globe,
  Sun,
  Moon,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  PlusCircle,
  FolderGit2
} from 'lucide-react';
import { CircularLoader } from './CircularLoader';
import { ExecutionMode, FullStatus, DeployedProject } from '../types';

interface TopNavbarProps {
  mode: ExecutionMode;
  onToggleMode: () => void;
  isSwitchingMode?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  status: FullStatus;
  selectedRegion: string;
  onSelectRegion: (reg: string) => void;
  onNavigate?: (tabId: string) => void;
  onOpenConfig?: () => void;
  onOpenNewProject?: () => void;
  onSwitchProject?: (projectId: string) => Promise<void> | void;
}

const AWS_REGIONS = [
  { id: 'ap-south-1', code: 'ap-south-1', name: 'Mumbai' },
  { id: 'us-east-1', code: 'us-east-1', name: 'N. Virginia' },
  { id: 'us-west-2', code: 'us-west-2', name: 'Oregon' },
  { id: 'eu-west-1', code: 'eu-west-1', name: 'Ireland' },
];

export const TopNavbar: React.FC<TopNavbarProps> = React.memo(({
  mode,
  onToggleMode,
  isSwitchingMode = false,
  theme,
  onToggleTheme,
  status,
  selectedRegion,
  onSelectRegion,
  onOpenNewProject,
  onSwitchProject,
}) => {
  const [copied, setCopied] = useState(false);

  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);

  const currentRegion = AWS_REGIONS.find(r => r.id === selectedRegion) || AWS_REGIONS[0];

  const projectsList: DeployedProject[] = React.useMemo(() => {
    const list = [...(status.projects || [])];
    if (status.infrastructure.public_ip && !list.some(p => p.public_ip === status.infrastructure.public_ip)) {
      list.unshift({
        id: 'proj-current',
        name: `Current Project (${status.stack?.backend?.framework || status.stack?.backend?.type || 'Web App'})`,
        created_at: status.infrastructure.provisioned_at || 'Just now',
        region: selectedRegion,
        public_ip: status.infrastructure.public_ip,
        instance_id: status.infrastructure.instance_id || undefined,
        app_url: status.infrastructure.app_url || `http://${status.infrastructure.public_ip}`,
        status: status.infrastructure.status === 'ready' ? 'ready' : 'provisioning'
      });
    }
    return list;
  }, [status.projects, status.infrastructure.public_ip, status.infrastructure.instance_id, status.infrastructure.app_url, status.infrastructure.provisioned_at, status.infrastructure.status, status.stack, selectedRegion]);

  const activeProj = projectsList.find(p => p.id === status.active_project_id || (p.public_ip && p.public_ip === status.infrastructure.public_ip)) || projectsList[0];

  const isReady = status.infrastructure.status === 'ready';
  const isRunning = status.is_running_pipeline;

  const handleCopy = () => {
    if (status.infrastructure.public_ip) {
      navigator.clipboard.writeText(`http://${status.infrastructure.public_ip}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Close dropdowns on click outside or Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRegionOpen(false);
        setIsProjectDropdownOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setIsRegionOpen(false);
      }
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="top-navbar">
      {/* 1. Left Context Controls: Active Project & AWS Region Dropdown */}
      <div className="navbar-context-left">
        {/* Active Project Switcher Dropdown */}
        {activeProj && (
          <div className="navbar-project-wrapper" ref={projectDropdownRef}>
            <button
              type="button"
              className={`navbar-project-btn ${isProjectDropdownOpen ? 'open' : ''}`}
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              title="Active Cloud Project - Click to switch between deployed projects"
            >
              <FolderGit2 size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
              <span className="navbar-project-label">
                {activeProj.name || `Project: ${activeProj.public_ip}`}
              </span>
              <ChevronDown size={12} className={`navbar-project-arrow ${isProjectDropdownOpen ? 'open' : ''}`} style={{ flexShrink: 0 }} />
            </button>

            {isProjectDropdownOpen && (
              <div className="navbar-project-dropdown-menu">
                <div className="navbar-project-dropdown-header">
                  <span>Hosted Cloud Projects</span>
                  <span className="badge-count" style={{ background: 'var(--aws-orange)', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>
                    {projectsList.length}
                  </span>
                </div>
                <div className="navbar-project-list">
                  {projectsList.map((proj) => {
                    const isSelected = (status.active_project_id === proj.id) || (!status.active_project_id && proj.public_ip === status.infrastructure.public_ip);
                    const isHealthy = proj.status === 'ready' && !proj.chaos_fault;
                    return (
                      <button
                        key={proj.id}
                        type="button"
                        className={`navbar-project-item ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          if (onSwitchProject) onSwitchProject(proj.id);
                          setIsProjectDropdownOpen(false);
                        }}
                      >
                        <span className={`status-dot ${isHealthy ? 'healthy' : 'critical'}`} style={{ flexShrink: 0 }} />
                        <div className="navbar-project-item-text">
                          <div className="navbar-project-item-name">{proj.name}</div>
                          <div className="navbar-project-item-meta">
                            <span>{proj.public_ip}</span> &bull; <span>{proj.region || 'ap-south-1'}</span> &bull; <span>{proj.deployed_app || proj.stack?.backend?.type || 'App'}</span>
                          </div>
                        </div>
                        {isSelected && <Check size={13} color="var(--aws-orange)" style={{ flexShrink: 0, marginLeft: 'auto' }} />}
                      </button>
                    );
                  })}
                </div>
                {onOpenNewProject && (
                  <div className="navbar-project-dropdown-footer">
                    <button
                      type="button"
                      className="navbar-dropdown-action-btn"
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenNewProject();
                      }}
                    >
                      <PlusCircle size={13} />
                      <span>+ Deploy Another Project</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global AWS Region Selector */}
        <div className="navbar-region-wrapper" ref={regionDropdownRef}>
          <button
            type="button"
            className={`navbar-region-btn ${isRegionOpen ? 'open' : ''}`}
            onClick={() => setIsRegionOpen(!isRegionOpen)}
            title="Select AWS Region"
          >
            <Globe size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
            <span className="navbar-region-label">
              {currentRegion.code} ({currentRegion.name})
            </span>
            <ChevronDown size={12} className={`navbar-region-arrow ${isRegionOpen ? 'open' : ''}`} style={{ flexShrink: 0 }} />
          </button>

          {isRegionOpen && (
            <div className="navbar-region-dropdown-menu">
              <div className="navbar-region-dropdown-header">
                AWS Global Regions
              </div>
              {AWS_REGIONS.map((reg) => {
                const isSelected = selectedRegion === reg.id;
                return (
                  <button
                    key={reg.id}
                    type="button"
                    className={`navbar-region-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      onSelectRegion(reg.id);
                      setIsRegionOpen(false);
                    }}
                  >
                    <div className="navbar-region-item-text">
                      <span className="navbar-region-item-name">{reg.code}</span>
                      <span className="navbar-region-item-location">({reg.name})</span>
                    </div>
                    {isSelected && <Check size={12} color="var(--aws-orange)" style={{ flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. Right Actions: Node Status, Deploy Project, Mode & Theme */}
      <div className="navbar-actions">
        {/* Pipeline Status Badge */}
        {isRunning && (
          <div className="running-action-badge">
            <CircularLoader size={12} color="var(--aws-orange)" trackColor="rgba(255, 153, 0, 0.25)" />
            <span>{status.current_action || 'Processing...'}</span>
          </div>
        )}

        {/* Target Node Connection Pill */}
        {isReady && status.infrastructure.public_ip ? (
          <div className="navbar-node-pill">
            <span className="status-dot healthy" />
            <a
              href={`http://${status.infrastructure.public_ip}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: "'JetBrains Mono', Consolas, monospace", fontWeight: 700, color: 'inherit', textDecoration: 'none' }}
              title={`Click to open http://${status.infrastructure.public_ip} (Inbound Port 80 Open)`}
            >
              {status.infrastructure.public_ip}
            </a>
            <span className="protocol-pill" title="Web traffic served over HTTP on port 80 (Inbound Port 80 Open)">
              HTTP :80
            </span>
            <button onClick={handleCopy} className="navbar-icon-btn" title="Copy Full URL (http://)">
              {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
            </button>
            {status.infrastructure.app_url && (
              <a
                href={
                  status.infrastructure.app_url.includes('54.210.88')
                    ? 'http://127.0.0.1:8000/api/webapp/preview'
                    : status.infrastructure.app_url
                }
                target="_blank"
                rel="noreferrer"
                className="navbar-icon-btn"
                title={`Click to open http://${status.infrastructure.public_ip} (Inbound Port 80 Open)`}
              >
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        ) : (
          <div className="navbar-node-pill muted">
            <span className="status-dot pending" />
            <span>No Node Active</span>
          </div>
        )}

        {/* Deploy New Project Button */}
        {onOpenNewProject && (
          <button
            type="button"
            className="navbar-new-project-btn"
            onClick={onOpenNewProject}
            title="Deploy a new project (archives current deployment and resets wizard for fresh configuration)"
          >
            <PlusCircle size={14} style={{ flexShrink: 0 }} />
            <span className="navbar-new-project-text">+ New Project</span>
          </button>
        )}

        {/* Mode Toggle Button */}
        <button
          type="button"
          className={`navbar-mode-btn ${isSwitchingMode ? 'loading' : ''}`}
          onClick={onToggleMode}
          disabled={isSwitchingMode}
          title={mode === 'simulation' ? "Click to switch to Live AWS Mode (requires AWS Region, Access Key, and Secret Key)" : "Click to switch to Simulation Demo Mode"}
        >
          {isSwitchingMode ? (
            <>
              <CircularLoader size={11} color="var(--aws-orange)" trackColor="rgba(255, 153, 0, 0.2)" />
              <span>SWITCHING...</span>
            </>
          ) : (
            <>
              <span className={`mode-indicator-dot ${mode}`} />
              <span>{mode.toUpperCase()} MODE</span>
            </>
          )}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="navbar-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun size={15} color="var(--aws-orange)" />
          ) : (
            <Moon size={15} color="var(--aws-blue)" />
          )}
        </button>
      </div>
    </header>
  );
});
