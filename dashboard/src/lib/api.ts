/**
 * Data boundary for the dashboard. Server info/metrics and auth are served by
 * the Go probe (dashboard/server); services still resolve with mock data until
 * the yoi CLI data model lands (see docs/adr/dashboard-frontend-stack.md).
 */

export const SESSION_KEY = "yoi-dashboard-authed";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (res.status === 401) {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
    throw new Error("not authenticated");
  }
  if (!res.ok) {
    throw new Error(`request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

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

export interface ServiceResource {
  kind: "container" | "process";
  name: string;
  status: string;
  cpuPercent: number;
  memBytes: number;
}

export interface AuditEntry {
  id: string;
  ts: string;
  action: string;
  result: "green" | "red";
  detail: string;
}

export type ServiceLinkKind = "website" | "docs" | "github" | "grafana";

export interface ServiceLink {
  kind: ServiceLinkKind;
  label: string;
  url: string;
}

export interface Service extends ServiceSummary {
  startedAt: string | null;
  resources: ServiceResource[];
  audit: AuditEntry[];
  links: ServiceLink[];
}

const GiB = 1024 ** 3;

const services: Service[] = [
  {
    id: "hermes",
    name: "Hermes",
    status: "running",
    startedAt: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(),
    resources: [
      { kind: "container", name: "hermes-server", status: "running", cpuPercent: 4.2, memBytes: 0.42 * GiB },
      { kind: "container", name: "hermes-postgres", status: "running", cpuPercent: 1.1, memBytes: 0.18 * GiB },
      { kind: "process", name: "hermes-worker", status: "running", cpuPercent: 0.6, memBytes: 0.09 * GiB },
    ],
    audit: [
      { id: "a3", ts: new Date(Date.now() - 3 * 24 * 3600_000).toISOString(), action: "deploy", result: "green", detail: "v1.4.2 部署完成，健康检查通过" },
      { id: "a2", ts: new Date(Date.now() - 3 * 24 * 3600_000 - 95_000).toISOString(), action: "deploy", result: "red", detail: "v1.4.2 首次启动失败：端口 8787 被占用" },
      { id: "a1", ts: new Date(Date.now() - 11 * 24 * 3600_000).toISOString(), action: "deploy", result: "green", detail: "v1.4.1 部署完成" },
    ],
    links: [
      { kind: "website", label: "官网", url: "https://example.com" },
      { kind: "grafana", label: "Grafana", url: "http://127.0.0.1:3001" },
      { kind: "github", label: "GitHub", url: "https://github.com/example/hermes" },
    ],
  },
  {
    id: "lobehub",
    name: "LobeHub",
    status: "degraded",
    startedAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    resources: [
      { kind: "container", name: "lobe-chat", status: "running", cpuPercent: 12.8, memBytes: 0.95 * GiB },
      { kind: "container", name: "lobe-postgres", status: "restarting", cpuPercent: 0.2, memBytes: 0.11 * GiB },
    ],
    audit: [
      { id: "b2", ts: new Date(Date.now() - 26 * 3600_000).toISOString(), action: "deploy", result: "green", detail: "v1.96.3 部署完成" },
      { id: "b1", ts: new Date(Date.now() - 40 * 3600_000).toISOString(), action: "restart", result: "red", detail: "lobe-postgres 内存超限被 OOM killer 终止" },
    ],
    links: [
      { kind: "website", label: "官网", url: "https://example.com" },
      { kind: "docs", label: "文档", url: "https://example.com/docs" },
    ],
  },
  {
    id: "openclaw",
    name: "OpenClaw",
    status: "stopped",
    startedAt: null,
    resources: [{ kind: "process", name: "openclaw-agent", status: "stopped", cpuPercent: 0, memBytes: 0 }],
    audit: [
      { id: "c1", ts: new Date(Date.now() - 6 * 24 * 3600_000).toISOString(), action: "stop", result: "green", detail: "手动停止，等待重新部署" },
    ],
    links: [],
  },
];

function delay(ms = 160) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  await delay();
  return services.map(({ id, name, status }) => ({ id, name, status }));
}

export async function getService(id: string): Promise<Service | null> {
  await delay();
  return services.find((s) => s.id === id) ?? null;
}
