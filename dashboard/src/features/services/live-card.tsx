import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Service, ServiceLive } from "@/lib/api";
import { formatBytes, formatPercent } from "@/lib/format";

type LiveCardProps = {
  service: Service;
  live?: ServiceLive;
};

const UNDETECTABLE_HINT = "还没配置 runtime，让 Agent 补上才能看占用。";

export const LiveCard: FC<LiveCardProps> = ({ service, live }) => {
  const limits = [service.cpu && `cpu ${service.cpu}`, service.memory && `memory ${service.memory}`, service.ports && `端口 ${service.ports}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">资源占用</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        {!live ? (
          <p className="py-6 text-center text-sm text-muted-foreground">读取中…</p>
        ) : live.undetectable ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <span>无法探测</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className="inline-flex size-4 cursor-help items-center justify-center rounded-full border border-border text-[10px] leading-none text-muted-foreground"
                  aria-label={UNDETECTABLE_HINT}
                >
                  ?
                </span>
              </TooltipTrigger>
              <TooltipContent>{UNDETECTABLE_HINT}</TooltipContent>
            </Tooltip>
          </div>
        ) : live.error && live.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">探测失败{live.error ? `：${live.error}` : ""}</p>
        ) : live.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">没有绑定目标</p>
        ) : (
          <div className="divide-y divide-border">
            {live.rows.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm">{row.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.status}
                    {row.pid != null && <> · pid {row.pid}</>}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums">
                  {row.cpuPercent != null ? formatPercent(row.cpuPercent) : "—"}
                  {" · "}
                  {row.memBytes != null ? formatBytes(row.memBytes) : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
        {limits && <p className="mt-2 text-xs text-muted-foreground">限制 {limits}</p>}
      </CardContent>
    </Card>
  );
};
