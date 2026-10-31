import React, { useState, useEffect } from 'react';
import { Search, X, Layers, Package, ShieldCheck, Activity, Flame, Terminal, Settings, HelpCircle, Network } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onOpenConfig: () => void;
  onOpenArch: () => void;
  onOpenViva: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenConfig,
  onOpenArch,
  onOpenViva,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = [
    { id: 'tf', label: 'Step 1: Terraform Infrastructure as Code', sub: 'Provision EC2, VPC, Security Group', icon: Layers, action: () => { onNavigate('tf'); onClose(); } },
    { id: 'ans', label: 'Step 2: Ansible Full-Stack Deployment', sub: 'Deploy React, Python, Java Spring Boot, Node, Postgres', icon: Package, action: () => { onNavigate('ans'); onClose(); } },
    { id: 'pup', label: 'Step 3: Puppet Compliance & Drift Baseline', sub: 'SSH Hardening, MOTD banner, security enforcement', icon: ShieldCheck, action: () => { onNavigate('pup'); onClose(); } },
    { id: 'nag', label: 'Step 4: Nagios Telemetry Probes', sub: 'Port 80, Backend API, Database, CPU, RAM, Disk', icon: Activity, action: () => { onNavigate('nag'); onClose(); } },
    { id: 'chaos', label: 'Chaos Engineering Outage Lab', sub: 'Simulate web crash, CPU spike, DB outage, auto-healing', icon: Flame, action: () => { onNavigate('chaos'); onClose(); } },
    { id: 'term', label: 'DevOps Live Terminal', sub: 'Real-time WebSocket streaming logs', icon: Terminal, action: () => { onNavigate('term'); onClose(); } },
    { id: 'arch', label: 'Architecture Blueprint', sub: 'Interactive 3-tier and 4-toolchain diagram', icon: Network, action: () => { onOpenArch(); onClose(); } },
    { id: 'viva', label: 'Viva Examination Guide', sub: '20+ technical questions & model answers for evaluation', icon: HelpCircle, action: () => { onOpenViva(); onClose(); } },
    { id: 'config', label: 'AWS Cloud Settings', sub: 'Configure Access Key, Secret Key, and Region', icon: Settings, action: () => { onOpenConfig(); onClose(); } },
  ];

  const filtered = items.filter(i =>
    i.label.toLowerCase().includes(query.toLowerCase()) ||
    i.sub.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px', padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-topbar)'
        }}>
          <Search size={18} color="#FF9900" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a command or search feature..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '0.92rem',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '0.5rem' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No matching features found for "{query}".
            </div>
          ) : (
            filtered.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '6px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
