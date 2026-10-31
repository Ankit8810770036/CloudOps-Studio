import React, { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, X, ExternalLink, Sparkles } from 'lucide-react';

export interface StepCompletionData {
  stepNumber: number;
  stepName: string;
  title: string;
  description: string;
  details: { label: string; value: string }[];
  nextStepTab: string;
  nextStepLabel: string;
  appUrl?: string | null;
}

interface StepCompletionNotificationProps {
  data: StepCompletionData | null;
  onClose: () => void;
  onProceed: (tab: string) => void;
}

export const StepCompletionNotification: React.FC<StepCompletionNotificationProps> = ({
  data,
  onClose,
  onProceed,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (data) {
      setVisible(true);
      // Auto-dismiss after 14 seconds if user doesn't interact
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 14000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [data, onClose]);

  if (!data || !visible) return null;

  return (
    <aside
      className="step-completion-card"
      role="status"
      aria-live="polite"
      aria-label="Step completed notification"
    >
      {/* Top Header Row */}
      <div className="step-completion-header">
        <div className="step-completion-badge">
          <CheckCircle2 size={14} color="#10B981" />
          <span>STEP {data.stepNumber} OF 4 COMPLETED</span>
        </div>
        <button
          type="button"
          className="step-completion-close"
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          title="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Main Title & Description */}
      <div className="step-completion-title">
        {data.title}
      </div>
      <p className="step-completion-desc">
        {data.description}
      </p>

      {/* Outcome Specs Grid */}
      {data.details && data.details.length > 0 && (
        <div className="step-completion-specs">
          {data.details.map((item, idx) => (
            <div key={idx} className="step-completion-spec-pill">
              <span className="spec-pill-label">{item.label}:</span>
              <span className="spec-pill-val">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action Footer & Next Step Guidance */}
      <div className="step-completion-actions">
        {data.appUrl && (
          <a
            href={data.appUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary"
            style={{ fontSize: '0.76rem', height: '30px', padding: '0 0.65rem' }}
          >
            <ExternalLink size={12} />
            <span>Open Website</span>
          </a>
        )}

        <button
          type="button"
          className="btn-primary step-completion-proceed-btn"
          onClick={() => {
            setVisible(false);
            onProceed(data.nextStepTab);
            onClose();
          }}
        >
          <span>{data.nextStepLabel}</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </aside>
  );
};
