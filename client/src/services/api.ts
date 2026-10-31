import { FullStatus, LogEntry } from '../types';

const API_BASE = 'http://127.0.0.1:8000';
const WS_BASE = 'ws://127.0.0.1:8000';

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
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/api/config`);
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
  return res.json();
}

export async function fetchWebappContent(): Promise<{ html: string }> {
  const res = await fetch(`${API_BASE}/api/webapp/content`);
  return res.json();
}

export async function saveWebappContent(html: string): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/webapp/content`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html }),
  });
  return res.json();
}

export async function enforcePuppet() {
  const res = await fetch(`${API_BASE}/api/puppet/enforce`, {
    method: 'POST',
  });
  return res.json();
}

export async function probeNagios() {
  const res = await fetch(`${API_BASE}/api/nagios/probe`, {
    method: 'POST',
  });
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

export async function clearLogs() {
  const res = await fetch(`${API_BASE}/api/logs/clear`, {
    method: 'POST',
  });
  return res.json();
}

export function connectLogWebSocket(onLog: (entry: LogEntry) => void): WebSocket {
  const ws = new WebSocket(`${WS_BASE}/ws/logs`);
  ws.onmessage = (event) => {
    try {
      const entry: LogEntry = JSON.parse(event.data);
      onLog(entry);
    } catch (e) {
      console.error('Failed to parse WS log', e);
    }
  };
  return ws;
}

