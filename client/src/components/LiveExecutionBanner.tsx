import React, { useState, useEffect } from 'react';
import { CircularLoader } from './CircularLoader';
import { Cloud, Zap, Clock, Terminal } from 'lucide-react';

interface LiveExecutionBannerProps {
  isRunning: boolean;
  currentAction: string | null;
  mode: string;
  latestLog?: string;
}

export const LiveExecutionBanner: React.FC<LiveExecutionBannerProps> = ({
  isRunning,
  currentAction,
  mode,
  latestLog
}) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
      return;
    }
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isRunning, currentAction]);

  if (!isRunning) return null;

  const isLiveMode = mode === 'live';
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSubtext = () => {
    const action = (currentAction || '').toLowerCase();
    if (action.includes('terraform')) {
      return isLiveMode
        ? 'Contacting AWS API to authenticate and provision VPC, Subnets, and EC2 Compute...'
        : 'Simulating infrastructure provisioning in local development sandbox...';
    }
    if (action.includes('ansible')) {
      return isLiveMode
        ? 'Connecting to Ubuntu EC2 host, configuring Nginx, and deploying application stack...'
        : 'Simulating application stack deployment with Nginx reverse proxy...';
    }
    if (action.includes('puppet')) {
      return 'Auditing and enforcing desired-state security configuration baseline...';
    }
    if (action.includes('nagios')) {
      return 'Probing host telemetry, port sockets, and service health endpoints...';
    }
    if (action.includes('chaos')) {
      return 'Simulating service fault and testing automated recovery workflows...';
    }
    return isLiveMode
      ? 'Live cloud process running in background. Please wait while AWS executes the task...'
      : 'Simulation process executing in background...';
  };

  return (
    <div className={`live-exec-banner ${isLiveMode ? 'live-mode' : 'sim-mode'}`}>
      <div className="live-exec-content">
        {/* Large Circular Spinner */}
        <div className="live-exec-spinner-wrapper">
          <CircularLoader
            size={34}
            strokeWidth={3.5}
            color={isLiveMode ? 'var(--aws-orange)' : 'var(--aws-blue)'}
            trackColor={isLiveMode ? 'rgba(255, 153, 0, 0.2)' : 'rgba(37, 99, 235, 0.2)'}
          />
          <div className="live-exec-pulse-dot" />
        </div>

        {/* Action & Status Copy */}
        <div className="live-exec-text-block">
          <div className="live-exec-header-row">
            <span className="live-exec-badge">
              {isLiveMode ? (
                <>
                  <Cloud size={12} />
                  <span>LIVE AWS EXECUTION</span>
                </>
              ) : (
                <>
                  <Zap size={12} />
                  <span>SIMULATION PIPELINE</span>
                </>
              )}
            </span>
            <div className="live-exec-timer">
              <Clock size={12} />
              <span>Elapsed: {formatTimer(seconds)}</span>
            </div>
          </div>

          <div className="live-exec-action-title">
            {currentAction || 'Cloud Process in Progress...'}
          </div>

          <div className="live-exec-subtext">
            {getSubtext()}
          </div>

          {latestLog && (
            <div className="live-exec-latest-log">
              <Terminal size={11} style={{ flexShrink: 0, opacity: 0.7 }} />
              <span className="live-exec-log-snippet">{latestLog}</span>
            </div>
          )}
        </div>
      </div>

      {/* Indeterminate Animated Progress Glow Line */}
      <div className="live-exec-progress-track">
        <div className="live-exec-progress-bar" />
      </div>
    </div>
  );
};

