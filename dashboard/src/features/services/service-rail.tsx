import type { FC } from "react";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/status-dot";
import { statusLabel } from "@/lib/status";
import type { Service, ServiceStatus } from "@/lib/api";
import { formatRelative } from "@/lib/format";

type ServiceRailProps = {
  service: Service;
  status?: ServiceStatus;
};

const desiredLabel: Record<string, string> = {
  running: "运行",
  stopped: "停止",
};

export const ServiceRail: FC<ServiceRailProps> = ({ service, status }) => {
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
              {status ? (
                <>
                  <StatusDot status={status} />
                  {statusLabel[status]}
                </>
              ) : (
                "读取中"
              )}
            </span>
          </div>
          {service.desiredState && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">期望</span>
              <span>{desiredLabel[service.desiredState] ?? service.desiredState}</span>
            </div>
          )}
          {service.packRef && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Pack</span>
              <span className="font-mono text-xs">{service.packRef}</span>
            </div>
          )}
          {service.createdAt && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">创建</span>
              <span>{formatRelative(service.createdAt)}</span>
            </div>
          )}
          {service.events[0] && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">最近事件</span>
              <span>{formatRelative(service.events[0].ts)}</span>
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
            {service.links.map((link) => (
              <a
                key={link.id || link.link}
                href={link.link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors hover:bg-secondary"
              >
                <ExternalLink className="size-4 text-muted-foreground" />
                {link.name || link.link}
                <ExternalLink className="ml-auto size-3.5 text-muted-foreground/60" />
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
