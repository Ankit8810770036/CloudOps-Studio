import React from 'react';
import { Layers, Package, ShieldCheck, Activity, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { FullStatus } from '../types';

interface PipelineStepperProps {
  status: FullStatus;
  activeTab: string;
  onNavigate: (tabId: string) => void;
}

export const PipelineStepper: React.FC<PipelineStepperProps> = ({
  status,
  activeTab,
  onNavigate,
}) => {
  const isTfReady = status.infrastructure.status === 'ready';
  const isTfRunning = status.infrastructure.status === 'provisioning';

  const isAnsDeployed = status.deployment.status === 'deployed';
  const isAnsRunning = status.deployment.status === 'deploying';

  const isPupCompliant = status.compliance.status === 'compliant';
  const isPupRunning = status.compliance.status === 'enforcing';

  const isNagHealthy = status.telemetry.overall_health === 'HEALTHY' && isAnsDeployed;

  const steps = [
    {
      id: 'tf',
      num: 1,
      title: 'Terraform IaC',
      sub: isTfReady ? (status.infrastructure.public_ip || 'Provisioned') : (isTfRunning ? 'Provisioning...' : 'Pending VPC & EC2'),
      isComplete: isTfReady,
      isRunning: isTfRunning,
      icon: Layers,
      accent: 'var(--accent-terraform)',
    },
    {
      id: 'ans',
      num: 2,
      title: 'Ansible Deploy',
      sub: isAnsDeployed ? `${status.deployment.web_server.toUpperCase()} Stack Live` : (isAnsRunning ? 'Deploying...' : 'Pending Stack'),
      isComplete: isAnsDeployed,
      isRunning: isAnsRunning,
      icon: Package,
      accent: 'var(--accent-ansible)',
    },
    {
      id: 'pup',
      num: 3,
      title: 'Puppet Baseline',
      sub: isPupCompliant ? '0 Drift • Hardened' : (isPupRunning ? 'Enforcing...' : 'Pending Baseline'),
      isComplete: isPupCompliant,
      isRunning: isPupRunning,
      icon: ShieldCheck,
      accent: 'var(--accent-puppet)',
    },
    {
      id: 'nag',
      num: 4,
      title: 'Nagios Telemetry',
      sub: isNagHealthy ? 'Health: 100% OK' : (status.telemetry.overall_health === 'CRITICAL' ? 'Alerts Active' : 'Active Probes'),
      isComplete: isNagHealthy,
      isRunning: false,
      icon: Activity,
      accent: 'var(--accent-nagios)',
    },
  ];

  const completedCount = steps.filter(s => s.isComplete).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="pipeline-stepper-box">
      <div className="stepper-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Pipeline Workflow:
          </span>
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: completedCount === 4 ? 'var(--status-success)' : 'var(--aws-orange)' }}>
            {completedCount} of 4 Steps Complete ({progressPercent}%)
          </span>
        </div>

        <div className="stepper-progress-track">
          <div
            className="stepper-progress-fill"
            style={{
              width: `${progressPercent}%`,
              background: completedCount === 4 ? 'var(--status-success)' : 'var(--aws-orange)'
            }}
          />
        </div>
      </div>

      <div className="stepper-nodes-row">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCurrentTab = activeTab === step.id;

          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                className={`stepper-node-btn ${step.isComplete ? 'complete' : ''} ${step.isRunning ? 'running' : ''} ${isCurrentTab ? 'active-tab' : ''}`}
                onClick={() => onNavigate(step.id)}
                title={`Click to view ${step.title}`}
              >
                <div className={`stepper-node-circle ${step.isComplete ? 'complete' : ''} ${step.isRunning ? 'running' : ''}`}>
                  {step.isComplete ? (
                    <Check size={13} color="#FFFFFF" strokeWidth={3} />
                  ) : step.isRunning ? (
                    <RefreshCw size={13} color="var(--aws-orange)" className="animate-spin" />
                  ) : (
                    <span>{step.num}</span>
                  )}
                </div>

                <div className="stepper-node-text">
                  <div className="stepper-node-title">
                    <span>{step.title}</span>
                  </div>
                  <div className="stepper-node-sub">
                    {step.sub}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <div className={`stepper-connector ${step.isComplete ? 'complete' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
