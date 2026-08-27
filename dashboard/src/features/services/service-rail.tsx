import type { FC } from "react";
import { BookOpen, ChartColumn, ExternalLink, FolderGit2, Globe } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import { statusLabel } from "@/lib/status";
import type { Service, ServiceLinkKind } from "@/lib/api";
import { formatRelative } from "@/lib/format";

const linkIcon: Record<ServiceLinkKind, typeof Globe> = {
  website: Globe,
  docs: BookOpen,
  github: FolderGit2,
  grafana: ChartColumn,
};

type ServiceRailProps = {
  service: Service;
};

export const ServiceRail: FC<ServiceRailProps> = ({ service }) => {
  const containers = service.resources.filter((r) => r.kind === "container").length;
  const processes = service.resources.filter((r) => r.kind === "process").length;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm font-normal text-muted-foreground">状态</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-4 pt-0 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">当前</span>
            <span className="inline-flex items-center gap-1.5">
              <StatusDot status={service.status} />
              {statusLabel[service.status]}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">资源</span>
            <span className="tabular-nums">
              {containers} 容器 · {processes} 进程
            </span>
          </div>
          {service.startedAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">启动</span>
              <span>{formatRelative(service.startedAt)}</span>
            </div>
          )}
          {service.audit[0] && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">最近部署</span>
              <span>{formatRelative(service.audit[0].ts)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {service.links.length > 0 && (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">外部链接</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col p-2">
            {service.links.map((link) => {
              const Icon = linkIcon[link.kind] ?? ExternalLink;
              return (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
                >
                  <Icon className="size-4 text-muted-foreground" />
                  {link.label}
                  <ExternalLink className="ml-auto size-3.5 text-muted-foreground/60" />
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
