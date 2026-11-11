import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Terminal as TerminalIcon, Copy, Trash2, ArrowDownCircle, Check, Search, Filter } from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalProps {
  logs: LogEntry[];
  onClear: () => void;
  fullHeight?: boolean;
}

type StageFilter = 'ALL' | 'TERRAFORM' | 'ANSIBLE' | 'PUPPET' | 'NAGIOS' | 'CHAOS' | 'ERRORS';

export const Terminal: React.FC<TerminalProps> = React.memo(({ logs, onClear, fullHeight = false }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StageFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Stage / Error Filter
      if (activeFilter === 'ERRORS') {
        const isErr = log.stream === 'stderr' || log.text.toLowerCase().includes('error') || log.text.toLowerCase().includes('fail');
        if (!isErr) return false;
      } else if (activeFilter !== 'ALL') {
        if (log.stage !== activeFilter) return false;
      }

      // Text Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return log.text.toLowerCase().includes(q) || log.stage.toLowerCase().includes(q);
      }

      return true;
    });
  }, [logs, activeFilter, searchQuery]);

  useEffect(() => {
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [filteredLogs, autoScroll]);

  const handleCopy = () => {
    const text = filteredLogs.map(l => `[${l.timestamp}] [${l.stage}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filterStages: StageFilter[] = ['ALL', 'TERRAFORM', 'ANSIBLE', 'PUPPET', 'NAGIOS', 'CHAOS', 'ERRORS'];

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

          <button className="terminal-btn" onClick={handleCopy} title="Copy filtered logs">
            {copied ? <Check size={13} color="var(--status-success)" /> : <Copy size={13} />}
          </button>

          <button className="terminal-btn" onClick={onClear} title="Clear terminal screen">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Filter and Search Sub-Bar */}
      <div className="terminal-filter-bar">
        <div className="terminal-chips">
          <Filter size={11} color="#64748B" style={{ marginRight: '2px' }} />
          {filterStages.map((stage) => {
            const isActive = activeFilter === stage;
            const isErrorChip = stage === 'ERRORS';
            return (
              <button
                key={stage}
                type="button"
                className={`terminal-chip ${isActive ? 'active' : ''} ${isErrorChip && isActive ? 'chip-errors' : ''}`}
                onClick={() => setActiveFilter(stage)}
              >
                {stage}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.68rem', color: '#64748B', fontFamily: 'monospace' }}>
            {filteredLogs.length} of {logs.length}
          </span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={11} color="#64748B" style={{ position: 'absolute', left: 6, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="terminal-search"
              style={{ paddingLeft: '1.4rem' }}
            />
          </div>
        </div>
      </div>

      <div className={`terminal-body ${fullHeight ? 'full-height' : ''}`} ref={terminalRef}>
        {filteredLogs.length === 0 ? (
          <div style={{ color: '#64748B', fontStyle: 'italic', padding: '1rem 0' }}>
            {logs.length === 0
              ? 'Ready. Waiting for Terraform, Ansible, Puppet, or Nagios events...'
              : 'No log lines matched the active filter or search query.'}
          </div>
        ) : (
          filteredLogs.map((log, index) => (
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
});
