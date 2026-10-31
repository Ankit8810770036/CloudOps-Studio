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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Network size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System Architecture & 3-Tier Polyglot Design</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
            This platform enables deployment of any application stack (Python, Java Spring Boot, Node.js, React, PostgreSQL, MySQL) across 4 industry-standard DevOps automation layers:
          </p>

          {/* 3-Tier Application Model */}
          <div style={{
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.6rem' }}>
              Full-Stack 3-Tier Topology (Managed by Ansible & Nginx)
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', textAlign: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Layout size={20} color="#60a5fa" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>Tier 1: Frontend</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>React SPA / HTML5</div>
                <div style={{ fontSize: '0.7rem', color: '#38bdf8', marginTop: '0.2rem' }}>Port 80 (Nginx Proxy)</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Server size={20} color="#f59e0b" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>Tier 2: Backend API</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Python / Java / Node.js</div>
                <div style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '0.2rem' }}>Port 8000 / 8080 / 5000</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Database size={20} color="#34d399" style={{ margin: '0 auto 0.4rem' }} />
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#e2e8f0' }}>Tier 3: Database</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>PostgreSQL / MySQL / Mongo</div>
                <div style={{ fontSize: '0.7rem', color: '#34d399', marginTop: '0.2rem' }}>Port 5432 / 3306 / 27017</div>
              </div>
            </div>
          </div>

          {/* 4 Toolchain Pillars */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(132, 79, 186, 0.1)', border: '1px solid rgba(132, 79, 186, 0.25)' }}>
              <Layers size={18} color="#c084fc" />
              <div>
                <strong style={{ color: '#e9d5ff', fontSize: '0.88rem' }}>1. Terraform (IaC)</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Provisions VPC, Subnet, Security Groups (Ports 22, 80, 443, 5000, 8000, 8080, 5432, 5666), and EC2 Instance.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(238, 0, 0, 0.1)', border: '1px solid rgba(238, 0, 0, 0.25)' }}>
              <Package size={18} color="#f87171" />
              <div>
                <strong style={{ color: '#fca5a5', fontSize: '0.88rem' }}>2. Ansible Automation</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Deploys Database tier, compiles/runs Backend runtime (OpenJDK/FastAPI/Node), and configures Nginx reverse proxy.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)' }}>
              <ShieldCheck size={18} color="#fbbf24" />
              <div>
                <strong style={{ color: '#fde68a', fontSize: '0.88rem' }}>3. Puppet Compliance</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Enforces database isolation (127.0.0.1 bind), supervises backend systemd daemons, hardens SSH, and prevents configuration drift.</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
              <Activity size={18} color="#34d399" />
              <div>
                <strong style={{ color: '#a7f3d0', fontSize: '0.88rem' }}>4. Nagios Core & NRPE</strong>
                <span style={{ color: '#cbd5e1', fontSize: '0.8rem', marginLeft: '0.5rem' }}>Probes Frontend HTTP (80), Backend API health (/api/health), Database socket (5432/3306), and host hardware load.</span>
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
