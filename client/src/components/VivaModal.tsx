import React, { useState } from 'react';
import { X, ChevronDown, ChevronRight, BookOpen } from 'lucide-react';

interface VivaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VIVA_QA = [
  {
    q: "Why do we use Terraform alongside Ansible instead of doing everything with Ansible?",
    a: "Terraform is purpose-built for Declarative Infrastructure as Code (IaC) - managing cloud state, VPCs, subnets, and EC2 lifecycles with state tracking (terraform.tfstate). Ansible is purpose-built for Configuration Management & Application Deployment - executing idempotent playbooks, software installations, and service management over agentless SSH. Combining them gives optimal separation of concerns: Terraform builds the house; Ansible furnishes the rooms."
  },
  {
    q: "What role does Puppet play if we already have Ansible?",
    a: "Ansible is primarily an imperative/push-based orchestrator, triggered during deployment waves. Puppet is a declarative, state-enforcement compliance engine. In our architecture, Puppet runs continuous compliance checks to detect and correct 'Configuration Drift' (e.g., unauthorized changes to /etc/motd, SSH configurations, or disabled firewalls). If someone manually alters a file on the server, Puppet automatically reconciles it back to the approved baseline."
  },
  {
    q: "How does Nagios monitor the server and detect service failures?",
    a: "Nagios utilizes two probing mechanisms: 1) Active Network Probing: testing TCP port 22 (SSH) and HTTP GET requests to port 80 (/healthz) to verify response codes (200 OK) and latency. 2) NRPE (Nagios Remote Plugin Executor): a secure daemon on the remote EC2 host that executes local check plugins (check_load, check_disk, check_mem) and returns structured exit codes (0=OK, 1=WARNING, 2=CRITICAL, 3=UNKNOWN)."
  },
  {
    q: "What happens when you click 'Simulate Web Crash' in the Chaos Lab?",
    a: "The platform issues a stop command to the web server daemon (systemctl stop nginx). Within seconds, Nagios's active HTTP check fails with 'Connection Refused (502)'. Nagios transitions the service state from OK to CRITICAL, triggering visual and auditory alerts in the UI. Clicking 'Auto-Heal' triggers an Ansible/Puppet automated remediation that restarts the daemon and restores the health check to OK."
  },
  {
    q: "How are SSH keys handled securely in this architecture?",
    a: "Terraform automatically generates an ephemeral 4096-bit RSA key pair using the tls_private_key resource, writes the private key to devops-key.pem with restricted permissions (0600), and registers the public key with AWS EC2. The backend orchestrator uses this key via Paramiko over encrypted SSH to execute configurations."
  },
  {
    q: "What is Idempotence in Ansible and why is it important?",
    a: "An operation is idempotent if running it once or multiple times produces the exact same end state without unintended side effects. If Nginx is already installed and running, running the playbook again will simply report 'ok' instead of re-installing or causing downtime."
  }
];

export const VivaModal: React.FC<VivaModalProps> = ({ isOpen, onClose }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} onWheel={(e) => e.stopPropagation()}>
      <div className="modal-content" style={{ maxWidth: '820px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BookOpen size={22} color="var(--aws-orange)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>DevOps Class Viva & Evaluation Guide</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Key technical questions and model answers prepared for your university professor review, project viva, and portfolio evaluation:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {VIVA_QA.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s'
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '0.95rem 1.15rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ color: 'var(--aws-orange)', fontWeight: 800 }}>Q{idx + 1}:</span>
                    <span>{item.q}</span>
                  </span>
                  {isOpen ? <ChevronDown size={18} color="var(--text-dim)" /> : <ChevronRight size={18} color="var(--text-dim)" />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: '1rem 1.15rem',
                    background: 'var(--bg-card)',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.65'
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};
