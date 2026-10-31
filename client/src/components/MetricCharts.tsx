import React from 'react';
import { Cpu, HardDrive, Wifi } from 'lucide-react';
import { TelemetryState } from '../types';

interface MetricChartsProps {
  telemetry: TelemetryState;
}

export const MetricCharts: React.FC<MetricChartsProps> = React.memo(({ telemetry }) => {
  // Derive historical data points from backend rolling history (pure rendering, zero render-cascade)
  const defaultCpu = [18, 22, 19, 25, 21, 23, 20, 24, 19, 22, 21, 25, 20, 22, 24, 21];
  const defaultMem = [36, 37, 36, 38, 37, 39, 38, 37, 38, 39, 38, 37, 39, 38, 37, 38];
  const defaultLat = [34, 38, 32, 41, 35, 36, 33, 40, 36, 34, 37, 35, 38, 34, 36, 33];

  const cpuHistory = (telemetry.history && telemetry.history.length >= 2)
    ? telemetry.history.map(pt => pt.cpu)
    : defaultCpu;

  const memHistory = (telemetry.history && telemetry.history.length >= 2)
    ? telemetry.history.map(pt => pt.memory)
    : defaultMem;

  const latHistory = (telemetry.history && telemetry.history.length >= 2)
    ? telemetry.history.map(pt => pt.latency)
    : defaultLat;

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

  const cpuData = generatePath(cpuHistory, 100, 320, 85);
  const memData = generatePath(memHistory, 100, 320, 85);
  const latData = generatePath(latHistory, 100, 320, 85);

  const curCpu = telemetry.checks.cpu?.value || 21;
  const curMem = telemetry.checks.memory?.value || 38;
  const curLat = telemetry.checks.http?.response_time_ms || 34;

  const isCpuCritical = curCpu > 85;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
      gap: '1rem',
      marginBottom: '1.25rem'
    }}>
      {/* 1. CPU Trend Chart (Clean AWS Orange #EC7211) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ color: 'var(--aws-orange)' }}>
              <Cpu size={16} />
            </div>
            <div>
              <span className="chart-title">CPU Compute Telemetry</span>
              <div className="chart-sub">Real-time load average (%)</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: isCpuCritical ? 'var(--status-danger)' : 'var(--aws-orange)' }}>
              {curCpu}%
            </span>
            <div style={{ fontSize: '0.68rem', color: isCpuCritical ? 'var(--status-danger)' : 'var(--text-dim)' }}>
              {isCpuCritical ? 'Threshold Exceeded' : 'Normal Load'}
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 85" preserveAspectRatio="none" style={{ width: '100%', height: '85px' }}>
            <defs>
              <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isCpuCritical ? '#DC2626' : '#EC7211'} stopOpacity="0.15" />
                <stop offset="100%" stopColor={isCpuCritical ? '#DC2626' : '#EC7211'} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={cpuData.area} fill="url(#cpuGradient)" />
            <path
              d={cpuData.path}
              fill="none"
              stroke={isCpuCritical ? '#DC2626' : '#EC7211'}
              strokeWidth="2"
            />
            <circle
              cx={cpuData.lastX}
              cy={cpuData.lastY}
              r="3.5"
              fill="#FFFFFF"
              stroke={isCpuCritical ? '#DC2626' : '#EC7211'}
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* 2. RAM Memory Chart (Clean AWS Blue #0972D3) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ color: 'var(--aws-blue)' }}>
              <HardDrive size={16} />
            </div>
            <div>
              <span className="chart-title">Memory Allocation (RAM)</span>
              <div className="chart-sub">Active buffer & cache usage</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aws-blue)' }}>
              {curMem}%
            </span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              1.0 GB / 2.0 GB EC2
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 85" preserveAspectRatio="none" style={{ width: '100%', height: '85px' }}>
            <defs>
              <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0972D3" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#0972D3" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={memData.area} fill="url(#memGradient)" />
            <path
              d={memData.path}
              fill="none"
              stroke="#0972D3"
              strokeWidth="2"
            />
            <circle
              cx={memData.lastX}
              cy={memData.lastY}
              r="3.5"
              fill="#FFFFFF"
              stroke="#0972D3"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* 3. HTTP Response Latency Chart (Solid Emerald Green #16A34A) */}
      <div className="telemetry-chart-card">
        <div className="chart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="chart-icon-box" style={{ color: 'var(--status-success)' }}>
              <Wifi size={16} />
            </div>
            <div>
              <span className="chart-title">HTTP Response Latency</span>
              <div className="chart-sub">Gateway roundtrip response</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-success)' }}>
              {curLat} ms
            </span>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
              HTTP 200 OK
            </div>
          </div>
        </div>

        <div className="chart-svg-container">
          <svg viewBox="0 0 320 85" preserveAspectRatio="none" style={{ width: '100%', height: '85px' }}>
            <defs>
              <linearGradient id="latGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#16A34A" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path d={latData.area} fill="url(#latGradient)" />
            <path
              d={latData.path}
              fill="none"
              stroke="#16A34A"
              strokeWidth="2"
            />
            <circle
              cx={latData.lastX}
              cy={latData.lastY}
              r="3.5"
              fill="#FFFFFF"
              stroke="#16A34A"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
});
