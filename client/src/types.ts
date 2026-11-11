export type ExecutionMode = 'simulation' | 'live';

export interface InfrastructureState {
  status: 'not_provisioned' | 'provisioning' | 'ready' | 'destroyed' | 'error';
  instance_id: string | null;
  public_ip: string | null;
  public_dns: string | null;
  security_group: string | null;
  vpc_id: string | null;
  app_url: string | null;
  ssh_command: string | null;
  provisioned_at: string | null;
}

export interface StackTier {
  type: string;
  [key: string]: any;
}

export interface StackConfig {
  preset: string;
  frontend: StackTier;
  backend: StackTier;
  database: StackTier;
}

export interface DeploymentState {
  status: 'not_deployed' | 'deploying' | 'deployed' | 'failed';
  web_server: 'nginx' | 'apache';
  deployed_app: string;
  deployed_at: string | null;
  response_code: number | null;
}

export interface ComplianceRule {
  name: string;
  status: string;
}

export interface ComplianceState {
  status: 'pending' | 'compliant' | 'drift_detected' | 'enforcing';
  last_enforced: string | null;
  rules_enforced: ComplianceRule[];
  drift_count: number;
}

export interface CheckMetric {
  name: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'UNKNOWN' | 'DISABLED';
  [key: string]: any;
}

export interface AlertItem {
  id: string;
  timestamp: string;
  severity: 'WARNING' | 'CRITICAL' | 'INFO';
  title: string;
  description: string;
  service: string;
}

export interface TelemetryPoint {
  time: string;
  cpu: number;
  memory: number;
  latency: number;
}

export interface TelemetryState {
  overall_health: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'UNKNOWN';
  last_check: string | null;
  checks: {
    ping: CheckMetric;
    http: CheckMetric;
    backend_api?: CheckMetric;
    database?: CheckMetric;
    ssh: CheckMetric;
    cpu: CheckMetric;
    memory: CheckMetric;
    disk: CheckMetric;
  };
  alerts: AlertItem[];
  history?: TelemetryPoint[];
}

export interface ChaosState {
  active_fault: 'http_down' | 'backend_down' | 'db_down' | 'cpu_spike' | 'config_tamper' | null;
  description: string | null;
  injected_at: string | null;
}

export interface CloudConfig {
  aws_region: string;
  instance_type: string;
  environment: string;
  has_aws_keys: boolean;
  has_access_key?: boolean;
  has_secret_key?: boolean;
  has_session_token?: boolean;
  aws_access_key: string;
  aws_secret_key_masked: string;
  aws_session_token?: string;
  is_temporary_key?: boolean;
}

export interface UploadedCodePackage {
  framework: string;
  file_count: number;
  total_size_bytes: number;
  files: string[];
  uploaded_at: string;
  has_dockerfile?: boolean;
}

export interface CustomCodeState {
  frontend?: UploadedCodePackage | null;
  backend?: UploadedCodePackage | null;
}

export interface DeployedProject {
  id: string;
  name: string;
  created_at: string;
  region: string;
  public_ip: string;
  instance_id?: string;
  app_url?: string;
  stack?: StackConfig;
  deployed_app?: string;
  status: 'ready' | 'provisioning' | 'degraded' | 'healthy' | 'critical';
  chaos_fault?: string | null;
}

export interface FullStatus {
  mode: ExecutionMode;
  is_running_pipeline: boolean;
  current_action: string | null;
  infrastructure: InfrastructureState;
  stack?: StackConfig;
  deployment: DeploymentState;
  compliance: ComplianceState;
  telemetry: TelemetryState;
  chaos: ChaosState;
  custom_code?: CustomCodeState;
  projects?: DeployedProject[];
  active_project_id?: string | null;
}

export interface LogEntry {
  timestamp: string;
  text: string;
  stream: 'stdout' | 'stderr';
  stage: 'TERRAFORM' | 'ANSIBLE' | 'PUPPET' | 'NAGIOS' | 'CHAOS' | 'SYSTEM';
}
