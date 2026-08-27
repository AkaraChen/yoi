import type { ServiceStatus } from "@/lib/api";

export const statusLabel: Record<ServiceStatus, string> = {
  running: "运行中",
  degraded: "异常",
  stopped: "已停止",
};

export const statusDotClass: Record<ServiceStatus, string> = {
  running: "bg-terminal-ok",
  degraded: "bg-accent",
  stopped: "bg-muted-foreground/40",
};
