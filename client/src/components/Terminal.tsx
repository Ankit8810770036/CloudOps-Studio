import React, { useRef, useEffect, useState } from 'react';
import { Terminal as TerminalIcon, Copy, Trash2, ArrowDownCircle, Check } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  onClear: () => void;
  fullHeight?: boolean;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onClear, fullHeight = false }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleCopy = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.stage}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="terminal-card">
      <div className="terminal-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', fontWeight: 700, color: '#94A3B8' }}>
            <TerminalIcon size={14} color="var(--aws-orange)" />
            <span>DevOps Orchestrator Live Terminal &bull; Stream Socket (Port 8000)</span>
          </div>
        </div>

        <div className="terminal-actions">
          <button
            className="terminal-btn"
            onClick={() => setAutoScroll(!autoScroll)}
            style={{ color: autoScroll ? 'var(--aws-orange)' : '#94A3B8' }}
            title="Toggle Auto-Scroll"
          >
            <ArrowDownCircle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            <span>{autoScroll ? 'Auto-Scroll ON' : 'Auto-Scroll OFF'}</span>
          </button>

          <button className="terminal-btn" onClick={handleCopy} title="Copy all logs">
            {copied ? <Check size={13} color="var(--status-success)" /> : <Copy size={13} />}
          </button>

          <button className="terminal-btn" onClick={onClear} title="Clear terminal screen">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div className={`terminal-body ${fullHeight ? 'full-height' : ''}`} ref={terminalRef}>
        {logs.length === 0 ? (
          <div style={{ color: '#64748B', fontStyle: 'italic', padding: '1rem 0' }}>
            Ready. Waiting for Terraform, Ansible, Puppet, or Nagios events...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="terminal-line">
              <span className="terminal-time">[{log.timestamp}]</span>
              <span className={`terminal-tag tag-${log.stage}`}>{log.stage}</span>
              <span className={`terminal-text ${log.stream}`}>{log.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
