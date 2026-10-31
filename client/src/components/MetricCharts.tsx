import React, { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Wifi } from 'lucide-react';
import { TelemetryState } from '../types';

interface MetricChartsProps {
  telemetry: TelemetryState;
}

export const MetricCharts: React.FC<MetricChartsProps> = ({ telemetry }) => {
  // Rolling historical buffers (last 16 data points)
  const [cpuHistory, setCpuHistory] = useState<number[]>([18, 22, 19, 25, 21, 23, 20, 24, 19, 22, 21, 25, 20, 22, 24, 21]);
  const [memHistory, setMemHistory] = useState<number[]>([36, 37, 36, 38, 37, 39, 38, 37, 38, 39, 38, 37, 39, 38, 37, 38]);
  const [latHistory, setLatHistory] = useState<number[]>([34, 38, 32, 41, 35, 36, 33, 40, 36, 34, 37, 35, 38, 34, 36, 33]);

  useEffect(() => {
    const curCpu = telemetry.checks.cpu?.value || 20;
    const curMem = telemetry.checks.memory?.value || 38;
    const curLat = telemetry.checks.http?.response_time_ms || 35;

    setCpuHistory(prev => [...prev.slice(1), curCpu]);
    setMemHistory(prev => [...prev.slice(1), curMem]);
    setLatHistory(prev => [...prev.slice(1), curLat]);
  }, [telemetry]);

  // Helper to generate SVG smooth Bezier curve path
  const generatePath = (data: number[], maxVal: number, width: number, height: number) => {
    if (data.length < 2) return { path: '', area: '', lastX: 0, lastY: 0 };
    const step = width / (data.length - 1);
    const points = data.map((val, idx) => {
      const x = idx * step;
      const y = height - (Math.min(Math.max(val, 0), maxVal) / maxVal) * (height - 18) - 8;
      return { x, y };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const last = points[points.length - 1];
    const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

    return { path: pathD, area: areaD, lastX: last.x, lastY: last.y };
  };

  const cpuData = generatePath(cpuHistory, 100, 320, 90);
  const memData = generatePath(memHistory, 100, 320, 90);
  const latData = generatePath(latHistory, 100, 320, 90);

  const curCpu = telemetry.checks.cpu?.value || 21;
  const curMem = telemetry.checks.memory?.value || 38;
  const curLat = telemetry.checks.http?.response_time_ms || 34;

  const isCpuCritical = curCpu > 85;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      marginBottom: '1.5rem'
    }}>
      {/* 1. CPU Trend Chart (AWS Orange #FF9900) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ background: 'rgba(255, 153, 0, 0.12)', color: '#FF9900' }}>
              <Cpu size={15} />
            </div>
            <div>
              <span className="chart-title">CPU Compute Telemetry</span>
              <div className="chart-sub">Real-time load average (%)</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isCpuCritical ? '#EF4444' : '#FF9900' }}>
              {curCpu}%
            </span>
            <div style={{ fontSize: '0.68rem', color: isCpuCritical ? '#EF4444' : 'var(--text-muted)' }}>
              {isCpuCritical ? 'Threshold Exceeded' : 'Normal Operation'}
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 90" preserveAspectRatio="none" style={{ width: '100%', height: '90px' }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isCpuCritical ? '#EF4444' : '#FF9900'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={isCpuCritical ? '#EF4444' : '#FF9900'} stopOpacity="0.0" />
              </linearGradient>
              <filter id="cpuGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={cpuData.area} fill="url(#cpuGradient)" />
            <path
              d={cpuData.path}
              fill="none"
              stroke={isCpuCritical ? '#EF4444' : '#FF9900'}
              strokeWidth="2.5"
              filter="url(#cpuGlow)"
            />
            <circle
              cx={cpuData.lastX}
              cy={cpuData.lastY}
              r="4.5"
              fill="#FFFFFF"
              stroke={isCpuCritical ? '#EF4444' : '#FF9900'}
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* 2. RAM Memory Chart (AWS Blue #0073BB) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ background: 'rgba(0, 115, 187, 0.12)', color: '#0073BB' }}>
              <HardDrive size={15} />
            </div>
            <div>
              <span className="chart-title">Memory Allocation (RAM)</span>
              <div className="chart-sub">Active buffer & cache consumption</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0073BB' }}>
              {curMem}%
            </span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              1.0 GB / 2.0 GB EC2
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 90" preserveAspectRatio="none" style={{ width: '100%', height: '90px' }}>
            <defs>
              <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0073BB" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0073BB" stopOpacity="0.0" />
              </linearGradient>
              <filter id="memGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={memData.area} fill="url(#memGradient)" />
            <path
              d={memData.path}
              fill="none"
              stroke="#0073BB"
              strokeWidth="2.5"
              filter="url(#memGlow)"
            />
            <circle
              cx={memData.lastX}
              cy={memData.lastY}
              r="4.5"
              fill="#FFFFFF"
              stroke="#0073BB"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>

      {/* 3. HTTP Response Latency Chart (Emerald Green #10B981) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}>
              <Wifi size={15} />
            </div>
            <div>
              <span className="chart-title">HTTP Response Latency</span>
              <div className="chart-sub">End-to-end Nginx gateway roundtrip</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
              {curLat} ms
            </span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              HTTP 200 OK
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 90" preserveAspectRatio="none" style={{ width: '100%', height: '90px' }}>
            <defs>
              <linearGradient id="latGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </linearGradient>
              <filter id="latGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={latData.area} fill="url(#latGradient)" />
            <path
              d={latData.path}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              filter="url(#latGlow)"
            />
            <circle
              cx={latData.lastX}
              cy={latData.lastY}
              r="4.5"
              fill="#FFFFFF"
              stroke="#10B981"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
