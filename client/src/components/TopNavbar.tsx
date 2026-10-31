import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Globe,
  Sun,
  Moon,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Package,
  ShieldCheck,
  Activity,
  Flame,
  Terminal,
  Network,
  HelpCircle,
  Settings,
  X,
  ChevronDown
} from 'lucide-react';
import { ExecutionMode, FullStatus } from '../types';

interface TopNavbarProps {
  mode: ExecutionMode;
  onToggleMode: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  status: FullStatus;
  selectedRegion: string;
  onSelectRegion: (reg: string) => void;
  onNavigate: (tabId: string) => void;
  onOpenConfig: () => void;
  onOpenArch: () => void;
  onOpenViva: () => void;
}

const AWS_REGIONS = [
  { id: 'us-east-1', code: 'us-east-1', name: 'N. Virginia' },
  { id: 'us-west-2', code: 'us-west-2', name: 'Oregon' },
  { id: 'eu-west-1', code: 'eu-west-1', name: 'Ireland' },
  { id: 'ap-south-1', code: 'ap-south-1', name: 'Mumbai' },
];

export const TopNavbar: React.FC<TopNavbarProps> = React.memo(({
  mode,
  onToggleMode,
  theme,
  onToggleTheme,
  status,
  selectedRegion,
  onSelectRegion,
  onNavigate,
  onOpenConfig,
  onOpenArch,
  onOpenViva,
}) => {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);

  const currentRegion = AWS_REGIONS.find(r => r.id === selectedRegion) || AWS_REGIONS[0];

  const isReady = status.infrastructure.status === 'ready';
  const isRunning = status.is_running_pipeline;

  const handleCopy = () => {
    if (status.infrastructure.public_ip) {
      navigator.clipboard.writeText(status.infrastructure.public_ip);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard shortcut Ctrl+K to focus search input in-place
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsRegionOpen(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(e.target as Node)) {
        setIsRegionOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchItems = [
    { id: 'tf', label: '1. Terraform IaC', sub: 'Provision VPC, Subnets, EC2', icon: Layers, action: () => onNavigate('tf') },
    { id: 'ans', label: '2. Ansible Deploy', sub: 'Configure Frontend, Backend, DB', icon: Package, action: () => onNavigate('ans') },
    { id: 'pup', label: '3. Puppet Baseline', sub: 'Enforce desired security state', icon: ShieldCheck, action: () => onNavigate('pup') },
    { id: 'nag', label: '4. Nagios Telemetry', sub: 'Live service & hardware probes', icon: Activity, action: () => onNavigate('nag') },
    { id: 'chaos', label: 'Chaos Engineering', sub: 'Simulate crashes & test healing', icon: Flame, action: () => onNavigate('chaos') },
    { id: 'term', label: 'Live Terminal', sub: 'Streaming WebSocket logs', icon: Terminal, action: () => onNavigate('term') },
    { id: 'arch', label: 'Architecture Blueprint', sub: '3-tier and automation design', icon: Network, action: onOpenArch },
    { id: 'viva', label: 'Viva Q&A Guide', sub: 'Class presentation & defense', icon: HelpCircle, action: onOpenViva },
    { id: 'config', label: 'AWS Settings', sub: 'Credentials & Region config', icon: Settings, action: onOpenConfig },
  ];

  const filteredItems = searchItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sub.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header className="top-navbar">
      {/* 1. In-Place Global Search Bar (No Drag to Center) */}
      <div className="navbar-search-wrapper" ref={searchWrapperRef}>
        <Search size={14} color="var(--text-dim)" style={{ flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          type="text"
          className="navbar-search-input"
          placeholder="Search resources, steps, commands..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsSearchOpen(true);
          }}
          onFocus={() => setIsSearchOpen(true)}
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setIsSearchOpen(false);
            }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
          >
            <X size={13} />
          </button>
        ) : (
          <span className="navbar-kbd-shortcut">Ctrl+K</span>
        )}

        {/* In-Place Anchored Dropdown (Directly Underneath Search Bar) */}
        {isSearchOpen && (
          <div className="navbar-search-dropdown">
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', padding: '0.35rem 0.55rem 0.25rem', textTransform: 'uppercase' }}>
              Quick Navigation
            </div>
            {filteredItems.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                No matching results found for "{searchQuery}".
              </div>
            ) : (
              filteredItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => {
                      item.action();
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      background: 'var(--bg-card-subtle)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--aws-orange)',
                      flexShrink: 0
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.sub}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 2. Top Bar Action Controls (Perfect Vertical Centering & Exact Baseline Alignment) */}
      <div className="navbar-actions">
        {/* Pipeline Status Badge */}
        {isRunning && (
          <div className="running-action-badge">
            <RefreshCw size={12} className="animate-spin" />
            <span>{status.current_action || 'Processing...'}</span>
          </div>
        )}

        {/* Global AWS Region Selector (Exact Width Custom Dropdown, Never Mismatched) */}
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

        {/* Target Node Connection Pill */}
        {isReady && status.infrastructure.public_ip ? (
          <div className="navbar-node-pill">
            <span className="status-dot healthy" />
            <span style={{ fontFamily: "'JetBrains Mono', Consolas, monospace", fontWeight: 700 }}>
              {status.infrastructure.public_ip}
            </span>
            <button onClick={handleCopy} className="navbar-icon-btn" title="Copy Public IP">
              {copied ? <Check size={12} color="var(--status-success)" /> : <Copy size={12} />}
            </button>
            {status.infrastructure.app_url && (
              <a
                href={status.infrastructure.app_url}
                target="_blank"
                rel="noreferrer"
                className="navbar-icon-btn"
                title="Open Deployed Website"
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

        {/* Mode Toggle Button */}
        <button
          className="navbar-mode-btn"
          onClick={onToggleMode}
          title="Switch execution mode between Live AWS and Simulation"
        >
          <span className={`mode-indicator-dot ${mode}`} />
          <span>{mode.toUpperCase()} MODE</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          className="navbar-theme-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
