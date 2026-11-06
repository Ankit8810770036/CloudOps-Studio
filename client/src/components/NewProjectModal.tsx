import React, { useState } from 'react';
import { PlusCircle, X, Sparkles, CheckCircle2, Server, Layers } from 'lucide-react';
import { FullStatus } from '../types';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectName: string) => Promise<void>;
  status: FullStatus;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  status,
}) => {
  const currentIp = status.infrastructure.public_ip;
  const isCurrentlyDeployed = status.infrastructure.status === 'ready' && Boolean(currentIp);
  const nextProjectNum = (status.projects?.length || 0) + 1;
  const [projectName, setProjectName] = useState(`Project ${nextProjectNum}: New Cloud App`);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(projectName.trim() || `Project ${nextProjectNum}`);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      onWheel={(e) => e.stopPropagation()}
      style={{ zIndex: 1200 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                background: 'rgba(255, 153, 0, 0.15)',
                border: '1px solid rgba(255, 153, 0, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--aws-orange)',
                flexShrink: 0,
              }}
            >
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Deploy New Project
              </h3>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Start a fresh IaC & application deployment pipeline
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-dim)',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isCurrentlyDeployed ? (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '6px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-success)', fontWeight: 700 }}>
                <CheckCircle2 size={16} />
                <span>Existing Project Safe & Preserved</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.45 }}>
                Your current deployment (<strong style={{ color: 'var(--text-primary)' }}>{currentIp}</strong>) will be saved in your{' '}
                <strong style={{ color: 'var(--text-primary)' }}>Projects Registry</strong>. You can monitor and test it anytime from the <strong>Chaos Lab</strong>.
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: '0.85rem',
                borderRadius: '6px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Layers size={16} color="var(--aws-orange)" />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                This will reset the deployment wizard to Step 0 (Pre-Flight) so you can choose a new stack or upload new code.
              </span>
            </div>
          )}

          <div>
            <label
              htmlFor="project-name-input"
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '0.4rem',
              }}
            >
              Project Name / Tag
            </label>
            <input
              id="project-name-input"
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g. E-Commerce Backend, React Portal, Golang Service"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
              }}
            />
          </div>

          <div
            style={{
              padding: '0.75rem',
              borderRadius: '6px',
              background: 'rgba(255, 153, 0, 0.08)',
              border: '1px dashed rgba(255, 153, 0, 0.35)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.55rem',
              fontSize: '0.76rem',
              color: 'var(--text-dim)',
            }}
          >
            <Sparkles size={15} color="var(--aws-orange)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Once initialized, you can select any polyglot runtime (Python FastAPI, Spring Boot, Node.js Express, Universal Docker, or Static HTML) and deploy to AWS.
            </span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 700,
              }}
            >
              {isSubmitting ? (
                <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Server size={14} />
              )}
              <span>{isSubmitting ? 'Initializing...' : 'Reset & Deploy New Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
