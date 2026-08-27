/**
 * Data boundary for the dashboard. Server info/metrics, auth, and services
 * are all served by the Go probe (dashboard/server); services read the
 * yoi-server fact store (~/.yoi) via GET /api/services[/<id>].
 */

export const SESSION_KEY = "yoi-dashboard-authed";

class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 401) {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
    throw new ApiError(401, "not authenticated");
  }
  if (!res.ok) {
    throw new ApiError(res.status, `request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// Only "running" and "stopped" occur today: the status is the service's
// desired_state (intent), and "removed" services are filtered out by the
// probe. "degraded" stays in the type for when live state lands.
export type ServiceStatus = "running" | "degraded" | "stopped";

export interface ServerInfo {
  hostname: string;
  os: string;
  kernel: string;
  arch: string;
  cpuModel: string;
  cpuCores: number;
  virtualization: string;
  bootTime: string;
}

export interface ServerMetrics {
  cpuPercent: number;
  memUsed: number;
  memTotal: number;
  swapUsed: number;
  swapTotal: number;
  diskUsed: number;
  diskTotal: number;
  netUpRate: number;
  netDownRate: number;
  netUpTotal: number;
  netDownTotal: number;
  tcpConns: number;
  udpConns: number;
  processCount: number;
  load1: number;
  load5: number;
  load15: number;
  uptimeSec: number;
}

export interface ServiceSummary {
  id: string;
  name: string;
  status: ServiceStatus;
}

export interface ServiceLink {
  kind: string;
  label: string;
  url: string;
}

/** The service spec is agent-written free-form JSON; known keys are typed,
 *  anything else passes through. */
export interface ServiceSpec {
  ports?: number[];
  env?: Record<string, string>;
  resources?: Record<string, string>;
  health_check?: { endpoint?: string; expect?: number };
  links?: ServiceLink[];
  [key: string]: unknown;
}

export interface Release {
  id: string;
  seq: string;
  status: "pending" | "active" | "failed" | "superseded";
  image: string;
  createdBy: string;
  createdAt: string;
  plan: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
  outcome: Record<string, unknown> | null;
}

export interface ServiceEvent {
  id: number;
  ts: string;
  service: string;
  release?: string;
  actor: string;
  kind: string;
  summary: string;
  data?: Record<string, unknown>;
}

export interface Service extends ServiceSummary {
  packRef: string;
  createdAt: string;
  spec: ServiceSpec;
  links: ServiceLink[];
  releases: Release[];
  events: ServiceEvent[];
}

export async function login(password: string): Promise<boolean> {
  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  return res.ok;
}

export async function getServerInfo(): Promise<ServerInfo> {
  return apiFetch<ServerInfo>("/api/server/info");
}

export async function getServerMetrics(): Promise<ServerMetrics> {
  return apiFetch<ServerMetrics>("/api/server/metrics");
}

export interface HistoryPoint {
  ts: string;
  cpuPercent: number;
  memPercent: number;
  netUpRate: number;
  netDownRate: number;
  load1: number;
}

export interface ServerHistory {
  intervalSec: number;
  points: HistoryPoint[];
}

export async function getServerHistory(): Promise<ServerHistory> {
  return apiFetch<ServerHistory>("/api/server/history");
}

export async function getServices(): Promise<ServiceSummary[]> {
  return apiFetch<ServiceSummary[]>("/api/services");
}

export async function getService(id: string): Promise<Service | null> {
  try {
    return await apiFetch<Service>(`/api/services/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return null;
    }
    throw err;
  }
}
