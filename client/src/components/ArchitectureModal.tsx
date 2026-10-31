import React from 'react';
import { X, Network, Layers, Package, ShieldCheck, Activity, ArrowRight } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '780px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Network size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>System Architecture & Toolchain Synergy</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            This platform illustrates industry-standard separation of concerns across the 4 foundational pillars of modern DevOps infrastructure:
          </p>

          {/* Flow Diagram Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(132, 79, 186, 0.1)',
              border: '1px solid rgba(132, 79, 186, 0.3)'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#844fba', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#e9d5ff' }}>1. Terraform (Infrastructure as Code)</h4>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Provisions AWS VPC, Subnet, Security Groups (Ports 22, 80, 443, 5666), and Ubuntu 22.04 LTS EC2 Instance.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#64748b' }}>↓ Provisions compute & networking</div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(238, 0, 0, 0.1)',
              border: '1px solid rgba(238, 0, 0, 0.3)'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#ee0000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fca5a5' }}>2. Ansible (Configuration & Deployment)</h4>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Installs Nginx or Apache, configures virtual hosts, and deploys the responsive web application onto the cloud instance.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#64748b' }}>↓ Configures application stack</div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={18} color="#1e1e1e" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fde68a' }}>3. Puppet (Compliance & Drift Self-Healing)</h4>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Hardens SSH daemon, enforces security compliance banners, installs fail2ban, and automatically heals configuration drift.</p>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#64748b' }}>↓ Hardens baseline & prepares telemetry sensors</div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#a7f3d0' }}>4. Nagios (Continuous Probing & Alerting)</h4>
                <p style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Active health checks over NRPE, HTTP port 80, SSH port 22, CPU load, and disk space with Warning/Critical alert rules.</p>
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
