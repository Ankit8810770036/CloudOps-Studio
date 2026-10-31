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
      <div className="modal-content" style={{ maxWidth: '840px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Network size={22} color="var(--aws-orange)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>System Architecture & 3-Tier Polyglot Design</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            This platform enables deployment of any application stack (Python FastAPI, Java Spring Boot, Node.js, React, PostgreSQL, MySQL) across 4 industry-standard DevOps automation layers:
          </p>

          {/* 3-Tier Application Model */}
          <div style={{
            background: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--aws-blue-bright)', marginBottom: '0.85rem' }}>
              Full-Stack 3-Tier Topology (Managed by Ansible & Nginx)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', textAlign: 'center' }}>
              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Layout size={22} color="#0EA5E9" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Tier 1: Frontend</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>React SPA / HTML5</div>
                <div style={{ fontSize: '0.72rem', color: '#0EA5E9', fontWeight: 700, marginTop: '0.25rem' }}>Port 80 (Nginx Proxy)</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Server size={22} color="#F59E0B" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Tier 2: Backend API</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Python / Java / Node.js</div>
                <div style={{ fontSize: '0.72rem', color: '#F59E0B', fontWeight: 700, marginTop: '0.25rem' }}>Port 8000 / 8080 / 5000</div>
              </div>

              <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Database size={22} color="#10B981" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Tier 3: Database</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>PostgreSQL / MySQL / Mongo</div>
                <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 700, marginTop: '0.25rem' }}>Port 5432 / 3306 / 27017</div>
              </div>
            </div>
          </div>

          {/* 4 Toolchain Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <Layers size={20} color="#A855F7" />
              <div>
                <strong style={{ color: '#A855F7', fontSize: '0.9rem' }}>1. Terraform (IaC)</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>Provisions VPC, Subnet, Security Groups (Ports 22, 80, 443, 5000, 8000, 8080, 5432, 5666), and EC2 Instance.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)' }}>
              <Package size={20} color="#FF4D4D" />
              <div>
                <strong style={{ color: '#FF4D4D', fontSize: '0.9rem' }}>2. Ansible Automation</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>Deploys Database tier, compiles/runs Backend runtime (OpenJDK/FastAPI/Node), and configures Nginx reverse proxy.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <ShieldCheck size={20} color="#F59E0B" />
              <div>
                <strong style={{ color: '#F59E0B', fontSize: '0.9rem' }}>3. Puppet Compliance</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>Enforces database isolation (127.0.0.1 bind), supervises backend systemd daemons, hardens SSH, and prevents configuration drift.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.95rem', padding: '0.85rem 1.1rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <Activity size={20} color="#10B981" />
              <div>
                <strong style={{ color: '#10B981', fontSize: '0.9rem' }}>4. Nagios Core & NRPE</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>Probes Frontend HTTP (80), Backend API health (/api/health), Database socket (5432/3306), and host hardware load.</span>
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
