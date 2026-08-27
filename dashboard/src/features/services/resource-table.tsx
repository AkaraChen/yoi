import type { FC } from "react";
import { Container, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceResource } from "@/lib/api";
import { formatBytes, formatPercent } from "@/lib/format";

type ResourceTableProps = {
  resources: ServiceResource[];
};

const ResourceRow: FC<{ resource: ServiceResource }> = ({ resource: r }) => {
  return (
    <div className="flex items-center gap-3 px-1 py-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
        {r.kind === "container" ? <Container className="size-4" /> : <Terminal className="size-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs">{r.name}</p>
        <p className="text-xs text-muted-foreground">
          {r.kind === "container" ? "容器" : "进程"} · {r.status}
        </p>
      </div>
      <div className="flex w-36 shrink-0 flex-col items-end gap-1">
        <span className="text-xs tabular-nums">{formatPercent(r.cpuPercent)} CPU</span>
        <span className="h-1 w-full overflow-hidden rounded-full bg-secondary">
          <span
            className="block h-full rounded-full bg-primary/70"
            style={{ width: `${Math.min(100, r.cpuPercent)}%` }}
          />
        </span>
      </div>
      <span className="w-20 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {formatBytes(r.memBytes)}
      </span>
    </div>
  );
};

export const ResourceTable: FC<ResourceTableProps> = ({ resources }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">资源占用</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-4 pt-1">
        {resources.map((r) => (
          <ResourceRow key={r.name} resource={r} />
        ))}
      </CardContent>
    </Card>
  );
};
