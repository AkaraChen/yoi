import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuditEntry } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

type AuditLogProps = {
  entries: AuditEntry[];
};

const AuditItem: FC<{ entry: AuditEntry; last: boolean }> = ({ entry, last }) => {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
      <span
        className={cn(
          "mt-1.5 size-[11px] shrink-0 rounded-full border-2",
          entry.result === "green"
            ? "border-terminal-ok bg-terminal-ok/20"
            : "border-destructive bg-destructive/20",
        )}
      />
      <div className="min-w-0">
        <p className="text-sm">
          {entry.action}
          <span
            className={cn(
              "ml-2 text-xs",
              entry.result === "green" ? "text-terminal-ok" : "text-destructive",
            )}
          >
            {entry.result === "green" ? "成功" : "失败"}
          </span>
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{entry.detail}</p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground/70">
          {formatRelative(entry.ts)}
        </p>
      </div>
    </li>
  );
};

export const AuditLog: FC<AuditLogProps> = ({ entries }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">部署记录</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {entries.length > 0 ? (
          <ul className="px-1 pt-1">
            {entries.map((entry, i) => (
              <AuditItem key={entry.id} entry={entry} last={i === entries.length - 1} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">暂无部署记录</p>
        )}
      </CardContent>
    </Card>
  );
};
