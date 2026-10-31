import React from 'react';
import { X, Network, Layers, Package, ShieldCheck, Activity, Database, Server, Layout } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Network size={20} color="var(--aws-orange)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>System Architecture & 3-Tier Polyglot Design</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.15rem' }}>
            This platform enables automated deployment of any application stack (Python FastAPI, Java Spring Boot, Node.js, React, PostgreSQL, MySQL) across 4 industry-standard DevOps automation layers:
          </p>

          {/* 3-Tier Application Model */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1.15rem',
            marginBottom: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--aws-blue)', marginBottom: '0.75rem' }}>
              Full-Stack 3-Tier Topology (Managed by Ansible & Nginx)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Layout size={20} color="var(--aws-blue)" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Tier 1: Frontend</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>React SPA / HTML5</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--aws-blue)', fontWeight: 700, marginTop: '0.2rem' }}>Port 80 (Nginx Proxy)</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Server size={20} color="var(--aws-orange)" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Tier 2: Backend API</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Python / Java / Node.js</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--aws-orange)', fontWeight: 700, marginTop: '0.2rem' }}>Port 8000 / 8080 / 5000</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                <Database size={20} color="var(--status-success)" style={{ margin: '0 auto 0.35rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Tier 3: Database</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>PostgreSQL / MySQL / Mongo</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--status-success)', fontWeight: 700, marginTop: '0.2rem' }}>Port 5432 / 3306 / 27017</div>
              </div>
            </div>
          </div>

          {/* 4 Toolchain Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <Layers size={18} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--accent-terraform)', fontSize: '0.88rem' }}>1. Terraform (IaC)</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.45rem' }}>Provisions VPC, Subnet, Security Groups (Ports 22, 80, 443, 5000-8080, 5666), and EC2 Instance.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <Package size={18} color="var(--accent-ansible)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--accent-ansible)', fontSize: '0.88rem' }}>2. Ansible Automation</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.45rem' }}>Deploys Database tier, compiles/runs Backend runtime (OpenJDK/FastAPI/Node), and configures Nginx reverse proxy.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <ShieldCheck size={18} color="var(--accent-puppet)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--accent-puppet)', fontSize: '0.88rem' }}>3. Puppet Compliance</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.45rem' }}>Enforces database isolation (127.0.0.1 bind), supervises backend systemd daemons, hardens SSH, and prevents configuration drift.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '6px', background: 'var(--bg-card-subtle)', border: '1px solid var(--border-color)' }}>
              <Activity size={18} color="var(--accent-nagios)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ color: 'var(--accent-nagios)', fontSize: '0.88rem' }}>4. Nagios Core & NRPE</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.45rem' }}>Probes Frontend HTTP (80), Backend API health (/api/health), Database socket (5432/3306), and host hardware load.</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={onClose}>Close Blueprint</button>
          </div>
        </div>
      </div>
    </div>
  );
};
