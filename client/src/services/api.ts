import { FullStatus, LogEntry, CloudConfig } from '../types';

const isBrowser = typeof window !== 'undefined';
const protocol = isBrowser && window.location.protocol === 'https:' ? 'https:' : 'http:';
const wsProtocol = isBrowser && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const hostname = isBrowser ? window.location.hostname : '127.0.0.1';

// In Vite dev server mode (port 5173 or 3000), target backend at port 8000 on the same host
const isDev = isBrowser && (window.location.port === '5173' || window.location.port === '3000');

export const API_BASE = isBrowser
  ? (isDev ? `${protocol}//${hostname}:8000` : '')
  : 'http://127.0.0.1:8000';

export const WS_BASE = isBrowser
  ? (isDev ? `${wsProtocol}//${hostname}:8000` : `${wsProtocol}//${window.location.host}`)
  : 'ws://127.0.0.1:8000';

export async function fetchStatus(): Promise<FullStatus> {
  const res = await fetch(`${API_BASE}/api/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function setExecutionMode(mode: 'simulation' | 'live') {
  const res = await fetch(`${API_BASE}/api/mode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to switch execution mode');
  }
  return res.json();
}

export async function fetchConfig(): Promise<CloudConfig> {
  const res = await fetch(`${API_BASE}/api/config`);
  if (!res.ok) throw new Error('Failed to fetch cloud config');
  return res.json();
}

export async function updateConfig(data: any) {
  const res = await fetch(`${API_BASE}/api/config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function applyTerraform(region: string, instanceType: string) {
  const res = await fetch(`${API_BASE}/api/terraform/apply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aws_region: region, instance_type: instanceType }),
  });
  return res.json();
}

export async function destroyTerraform() {
  const res = await fetch(`${API_BASE}/api/terraform/destroy`, {
    method: 'POST',
  });
  return res.json();
}

export async function deployAnsible(
  webServer: 'nginx' | 'apache',
  frontendType: string = 'react',
  backendType: string = 'python',
  databaseType: string = 'postgresql'
) {
  const res = await fetch(`${API_BASE}/api/ansible/deploy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      web_server: webServer,
      frontend_type: frontendType,
      backend_type: backendType,
      database_type: databaseType,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to deploy with Ansible');
  }
  return res.json();
}

export async function fetchWebappContent(): Promise<{ html: string }> {
  const res = await fetch(`${API_BASE}/api/webapp/content`);
  if (!res.ok) throw new Error('Failed to fetch webapp content');
  return res.json();
}

export async function saveWebappContent(html: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/webapp/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  if (!res.ok) throw new Error('Failed to save webapp content');
  return res.json();
}

export async function enforcePuppet() {
  const res = await fetch(`${API_BASE}/api/puppet/enforce`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to enforce Puppet compliance');
  }
  return res.json();
}

export async function probeNagios() {
  const res = await fetch(`${API_BASE}/api/nagios/probe`, {
    method: 'POST',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to probe Nagios telemetry');
  }
  return res.json();
}

export async function injectChaos(faultType: string) {
  const res = await fetch(`${API_BASE}/api/chaos/inject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault_type: faultType }),
  });
  return res.json();
}

export async function healChaos() {
  const res = await fetch(`${API_BASE}/api/chaos/heal`, {
    method: 'POST',
  });
  return res.json();
}

export async function uploadCustomCode(formData: FormData) {
  const res = await fetch(`${API_BASE}/api/upload/code`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload code');
  return res.json();
}

export async function clearUploadedCode(tier: 'frontend' | 'backend') {
  const res = await fetch(`${API_BASE}/api/upload/code/${tier}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear code');
  return res.json();
}

export async function fetchUploadStatus() {
  const res = await fetch(`${API_BASE}/api/upload/status`);
  if (!res.ok) throw new Error('Failed to fetch upload status');
  return res.json();
}

export async function fetchLogs(): Promise<{ logs: LogEntry[] }> {
  const res = await fetch(`${API_BASE}/api/logs`);
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

export async function clearLogs() {
  const res = await fetch(`${API_BASE}/api/logs/clear`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchProjects() {
  const res = await fetch(`${API_BASE}/api/projects`);
  if (!res.ok) throw new Error('Failed to fetch deployed projects');
  return res.json();
}

export async function createNewProject(name?: string) {
  const res = await fetch(`${API_BASE}/api/project/new`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error('Failed to start new project');
  return res.json();
}

export async function switchProject(projectId: string) {
  const res = await fetch(`${API_BASE}/api/projects/switch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId }),
  });
  if (!res.ok) throw new Error('Failed to switch project');
  return res.json();
}

export async function deleteProject(projectId: string) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete project');
  return res.json();
}

export function connectLogWebSocket(onLog: (entry: LogEntry) => void): () => void {
  let ws: WebSocket | null = null;
  let isClosed = false;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  const connect = () => {
    if (isClosed) return;
    try {
      ws = new WebSocket(`${WS_BASE}/ws/logs`);
      ws.onmessage = (event) => {
        try {
          const entry: LogEntry = JSON.parse(event.data);
          onLog(entry);
        } catch (e) {
          console.error('Failed to parse WS log', e);
        }
      };
      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };
      ws.onclose = () => {
        if (!isClosed) {
          reconnectTimer = setTimeout(connect, 2000);
        }
      };
    } catch {
      if (!isClosed) {
        reconnectTimer = setTimeout(connect, 2000);
      }
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    try {
      ws?.close();
    } catch {}
  };
}

