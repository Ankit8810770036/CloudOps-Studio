import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Flame, Server, Zap, Wrench, AlertOctagon, Cpu, Database, ShieldCheck, AlertTriangle, Layers, PlusCircle, Trash2 } from 'lucide-react';
import { CircularLoader } from './CircularLoader';
import { ChaosState, InfrastructureState, ExecutionMode, DeployedProject } from '../types';

interface ChaosPanelProps {
  chaos: ChaosState;
  infra: InfrastructureState;
  onInject: (faultType: string) => void;
  onHeal: () => Promise<void> | void;
  isRunning: boolean;
  mode?: ExecutionMode;
  onNavigate?: (tabId: string) => void;
  projects?: DeployedProject[];
  activeProjectId?: string | null;
  onSwitchProject?: (projectId: string) => Promise<void> | void;
  onNewProject?: () => void;
  onDeleteProject?: (projectId: string) => Promise<void> | void;
}

export const ChaosPanel: React.FC<ChaosPanelProps> = React.memo(({
  chaos,
  infra,
  onInject,
  onHeal,
  isRunning,
  mode = 'simulation',
  onNavigate,
  projects = [],
  activeProjectId,
  onSwitchProject,
  onNewProject,
  onDeleteProject,
}) => {
  const [isHealing, setIsHealing] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<DeployedProject | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isInfraReady = infra.status === 'ready';
  const hasFault = Boolean(chaos.active_fault);
  const isDriftFault = chaos.active_fault === 'config_tamper';
  const canInject = (mode === 'simulation' || isInfraReady) && !isRunning && !isHealing && !hasFault && !isSwitching;

  const deployedList: DeployedProject[] = React.useMemo(() => {
    const list = [...(projects || [])];
    if (infra.public_ip && !list.some(p => p.public_ip === infra.public_ip)) {
      list.unshift({
        id: 'proj-current',
        name: 'Current Deployment',
        created_at: infra.provisioned_at || 'Just now',
        region: 'AWS Region',
        public_ip: infra.public_ip,
        instance_id: infra.instance_id || undefined,
        app_url: infra.app_url || `http://${infra.public_ip}`,
        status: 'ready'
      });
    }
    return list;
  }, [projects, infra.public_ip, infra.provisioned_at, infra.instance_id, infra.app_url]);

  const handleSwitch = async (projId: string) => {
    if (isSwitching || isRunning || !onSwitchProject) return;
    setIsSwitching(true);
    try {
      await onSwitchProject(projId);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleHealClick = async () => {
    if (isHealing || isRunning) return;
    setIsHealing(true);
    try {
      await onHeal();
    } finally {
      setIsHealing(false);
    }
  };

  const handleDeleteClick = (proj: DeployedProject) => {
    setProjectToDelete(proj);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete || !onDeleteProject) return;
    setDeletingId(projectToDelete.id);
    try {
      await onDeleteProject(projectToDelete.id);
      setProjectToDelete(null);
    } finally {
      setDeletingId(null);
    }
  };

  const getButtonTitle = (actionName: string) => {
    if (isRunning || isHealing) return 'Remediation/Pipeline action currently in progress';
    if (hasFault) return 'Resolve current fault before injecting a new failure scenario';
    if (mode === 'live' && !isInfraReady) return 'Live EC2 target required: provision infrastructure with Step 1 (Terraform)';
    return actionName;
  };

  return (
    <div className={`chaos-lab-container ${hasFault ? 'fault-active' : ''}`}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.85rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            background: hasFault ? 'var(--status-danger-bg)' : 'rgba(220, 38, 38, 0.12)',
            border: `1px solid ${hasFault ? 'var(--status-danger)' : 'rgba(220, 38, 38, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--status-danger)',
            flexShrink: 0
          }}>
            <Flame size={16} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Chaos Engineering Lab
            </h4>
          </div>
        </div>

        <button
          onClick={handleHealClick}
          disabled={isRunning || isHealing}
          className="btn-primary"
          style={{
            background: hasFault ? (isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)') : 'rgba(22, 163, 74, 0.12)',
            border: `1px solid ${hasFault ? (isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)') : 'rgba(22, 163, 74, 0.3)'}`,
            color: hasFault ? '#FFFFFF' : 'var(--status-success)',
            height: '32px',
            fontSize: '0.78rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            cursor: (isRunning || isHealing) ? 'not-allowed' : 'pointer',
            opacity: (isRunning || isHealing) ? 0.8 : 1
          }}
          title={isDriftFault ? "Invoke Puppet desired-state engine to heal drift" : "Restart failed service and restore baseline"}
        >
          {isHealing ? (
            <div style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          ) : isDriftFault ? (
            <ShieldCheck size={14} />
          ) : (
            <Wrench size={13} />
          )}
          <span>{isHealing ? 'Remediating...' : isDriftFault ? 'Puppet Reconcile & Heal' : 'Auto-Remediate'}</span>
        </button>
      </div>

      {/* Multi-Project Target Node Switcher */}
      <div
        style={{
          background: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.65rem 0.85rem',
          marginBottom: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Layers size={14} color="var(--aws-orange)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Monitored Target Project:
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              background: 'rgba(255, 153, 0, 0.12)',
              color: 'var(--aws-orange)',
              padding: '0.1rem 0.45rem',
              borderRadius: '10px'
            }}>
              {deployedList.length} AWS {deployedList.length === 1 ? 'Node' : 'Nodes'}
            </span>
          </div>

          {onNewProject && (
            <button
              onClick={onNewProject}
              className="btn-secondary"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.74rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                borderRadius: '4px'
              }}
              title="Deploy a new project stack on AWS"
            >
              <PlusCircle size={12} color="var(--aws-orange)" />
              <span>+ Deploy New Project</span>
            </button>
          )}
        </div>

        {deployedList.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.2rem 0' }}>
            No AWS projects deployed yet. Complete Step 1 (Terraform) and Step 2 (Ansible) to deploy a target node.
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
            {deployedList.map((proj) => {
              const isSelected = activeProjectId === proj.id || (!activeProjectId && proj.public_ip === infra.public_ip);
              const hasProjectFault = Boolean(proj.chaos_fault || (isSelected && chaos.active_fault));
              return (
                <div
                  key={proj.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderRadius: '6px',
                    border: isSelected ? '1.5px solid var(--aws-orange)' : '1px solid var(--border-color)',
                    background: isSelected ? 'rgba(255, 153, 0, 0.14)' : 'var(--bg-card)',
                    padding: '0.15rem 0.3rem 0.15rem 0.65rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleSwitch(proj.id)}
                    disabled={isSwitching || isRunning || deletingId === proj.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.2rem 0',
                      border: 'none',
                      background: 'none',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-dim)',
                      fontWeight: isSelected ? 800 : 500,
                      fontSize: '0.76rem',
                      cursor: (isSwitching || isRunning) ? 'not-allowed' : 'pointer',
                      textAlign: 'left'
                    }}
                    title={`Switch monitoring & chaos injection to ${proj.name} (${proj.public_ip})`}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: hasProjectFault ? 'var(--status-danger)' : 'var(--status-success)',
                        flexShrink: 0
                      }}
                    />
                    <span>{proj.name}</span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', Consolas, monospace",
                        fontSize: '0.7rem',
                        opacity: 0.85,
                        background: 'var(--bg-card-subtle)',
                        padding: '0.05rem 0.35rem',
                        borderRadius: '3px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      {proj.public_ip}
                    </span>
                    {isSelected && (
                      <span style={{ fontSize: '0.66rem', color: 'var(--aws-orange)', fontWeight: 800 }}>
                        [ACTIVE]
                      </span>
                    )}
                  </button>

                  {/* Direct Delete Project Button */}
                  {onDeleteProject && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(proj);
                      }}
                      disabled={isRunning || deletingId === proj.id}
                      title={`Delete & terminate ${proj.name} (${proj.public_ip}) directly`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--status-danger)',
                        borderRadius: '4px',
                        padding: '0.2rem 0.3rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: (isRunning || deletingId === proj.id) ? 'not-allowed' : 'pointer',
                        opacity: 0.75,
                        transition: 'opacity 0.15s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
                    >
                      {deletingId === proj.id ? (
                        <CircularLoader size={12} color="var(--status-danger)" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Mode Missing Infra Banner */}
      {!isInfraReady && mode === 'live' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            padding: '0.65rem 0.85rem',
            borderRadius: '6px',
            background: 'rgba(234, 179, 8, 0.12)',
            border: '1px solid rgba(234, 179, 8, 0.35)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            marginBottom: '0.85rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={15} color="var(--status-warning, #eab308)" style={{ flexShrink: 0 }} />
            <span>
              <strong>Live Target Required:</strong> Provision AWS infrastructure with Terraform (Step 1) before injecting live chaos.
            </span>
          </div>
          {onNavigate && (
            <button
              onClick={() => onNavigate('tf')}
              className="btn-secondary"
              style={{
                padding: '0.3rem 0.65rem',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                borderRadius: '4px'
              }}
            >
              Go to Step 1: Terraform ➔
            </button>
          )}
        </div>
      )}

      {/* Outage / Drift Alert Banner */}
      {hasFault && (
        <div
          className="chaos-banner"
          style={{
            background: isDriftFault ? 'rgba(217, 119, 6, 0.12)' : undefined,
            border: isDriftFault ? '1px solid var(--accent-puppet)' : undefined,
            color: isDriftFault ? 'var(--text-primary)' : undefined
          }}
        >
          {isDriftFault ? (
            <ShieldCheck size={15} color="var(--accent-puppet)" style={{ flexShrink: 0 }} />
          ) : (
            <AlertOctagon size={15} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          )}
          <span>
            <strong>{isDriftFault ? 'SECURITY DRIFT INJECTED:' : 'ACTIVE OUTAGE:'}</strong> {chaos.description || 'System state deviated from baseline'} &mdash; Click {isDriftFault ? '"Puppet Reconcile & Heal"' : '"Auto-Remediate"'} to restore compliance.
          </span>
        </div>
      )}

      {/* Fault Injection Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.55rem' }}>
        <button
          onClick={() => onInject('http_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Frontend Nginx Service')}
        >
          <Zap size={13} color="var(--status-danger)" style={{ flexShrink: 0 }} />
          <span>Crash Frontend (80)</span>
        </button>

        <button
          onClick={() => onInject('backend_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Microservice Backend API')}
        >
          <Server size={13} color="var(--aws-orange)" style={{ flexShrink: 0 }} />
          <span>Crash Backend API</span>
        </button>

        <button
          onClick={() => onInject('db_down')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Crash Database Server')}
        >
          <Database size={13} color="var(--status-success)" style={{ flexShrink: 0 }} />
          <span>Crash Database</span>
        </button>

        <button
          onClick={() => onInject('cpu_spike')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Stress CPU to 96%')}
        >
          <Cpu size={13} color="var(--accent-terraform)" style={{ flexShrink: 0 }} />
          <span>CPU Spike (&gt;90%)</span>
        </button>

        <button
          onClick={() => onInject('config_tamper')}
          disabled={!canInject}
          className="chaos-btn"
          title={getButtonTitle('Inject unauthorized drift into /etc/motd and security baseline to trigger Puppet reconciliation')}
        >
          <ShieldCheck size={13} color="var(--accent-puppet)" style={{ flexShrink: 0 }} />
          <span>Tamper Config (Puppet Drift)</span>
        </button>
      </div>

      {/* Primary Auto-Remediate & Self-Healing Action Bar */}
      <button
        onClick={handleHealClick}
        disabled={isRunning || isHealing}
        className="btn-primary"
        style={{
          width: '100%',
          marginTop: '0.85rem',
          height: '40px',
          fontSize: '0.82rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.55rem',
          background: hasFault
            ? (isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)')
            : 'rgba(22, 163, 74, 0.12)',
          border: `1px solid ${hasFault ? (isDriftFault ? 'var(--accent-puppet)' : 'var(--status-success)') : 'rgba(22, 163, 74, 0.35)'}`,
          color: hasFault ? '#FFFFFF' : 'var(--status-success)',
          cursor: (isRunning || isHealing) ? 'not-allowed' : 'pointer',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          boxShadow: hasFault ? '0 0 14px rgba(22, 163, 74, 0.35)' : 'none'
        }}
        title="Trigger automated self-healing across Frontend, Backend, Database, and Puppet desired state without rebuilding infrastructure"
      >
        {isHealing ? (
          <div style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        ) : isDriftFault ? (
          <ShieldCheck size={15} />
        ) : (
          <Wrench size={14} />
        )}
        <span>
          {isHealing
            ? 'Remediating & Restoring All Services...'
            : isDriftFault
            ? 'Puppet Reconcile & Heal Configuration Drift'
            : hasFault
            ? 'Auto-Remediate & Heal All (Restore Baseline)'
            : 'Auto-Remediate & Heal All (Verify Desired State)'}
        </span>
      </button>

      {/* Direct Project Deletion Confirmation Modal */}
      {projectToDelete && createPortal(
        <div
          className="modal-overlay"
          style={{ zIndex: 100000 }}
          onClick={() => setProjectToDelete(null)}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
              padding: '1.35rem',
              position: 'relative',
              zIndex: 100001,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px var(--border-bright)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'var(--status-danger-bg)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--status-danger)',
                  flexShrink: 0
                }}
              >
                <Trash2 size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Delete Hosted Project
                </h3>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                  Direct Project Teardown from Chaos Lab
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5, margin: '0 0 1rem 0' }}>
              Are you sure you want to delete and terminate <strong style={{ color: 'var(--aws-orange)' }}>{projectToDelete.name}</strong> ({projectToDelete.public_ip})?
              This will remove the project from the active cloud registry and release its allocated resources.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setProjectToDelete(null)}
                disabled={deletingId === projectToDelete.id}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={deletingId === projectToDelete.id}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {deletingId === projectToDelete.id ? (
                  <>
                    <CircularLoader size={12} color="#FFFFFF" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
});
