import { useState, type FC } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Release } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const statusVariant: Record<Release["status"], "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  pending: "secondary",
  failed: "destructive",
  superseded: "outline",
};

const statusText: Record<Release["status"], string> = {
  active: "active",
  pending: "pending",
  failed: "failed",
  superseded: "superseded",
};

const JsonBlock: FC<{ value: Record<string, unknown> | null }> = ({ value }) => {
  if (!value) {
    return <p className="py-4 text-center text-sm text-muted-foreground">无</p>;
  }
  return (
    <pre className="max-h-72 overflow-auto rounded-md bg-secondary p-3 font-mono text-xs leading-5">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};

const ReleaseItem: FC<{ release: Release; last: boolean }> = ({ release: r, last }) => {
  const [open, setOpen] = useState(false);
  return (
    <li className={cn(!last && "border-b border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-1 py-2.5 text-left transition-colors hover:bg-secondary/60"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
        />
        <span className="shrink-0 font-mono text-xs text-muted-foreground">#{r.seq || "—"}</span>
        <Badge variant={statusVariant[r.status] ?? "outline"} className="shrink-0 font-normal">
          {statusText[r.status] ?? r.status}
        </Badge>
        <span className="min-w-0 truncate font-mono text-xs">{r.image || "—"}</span>
        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {r.createdBy} · {formatRelative(r.createdAt)}
        </span>
      </button>
      {open && (
        <div className="px-1 pb-3 pl-8">
          <Tabs defaultValue="plan">
            <TabsList className="h-8">
              <TabsTrigger value="plan" className="text-xs">Plan</TabsTrigger>
              <TabsTrigger value="config" className="text-xs">Config</TabsTrigger>
              <TabsTrigger value="outcome" className="text-xs">Outcome</TabsTrigger>
            </TabsList>
            <TabsContent value="plan">
              <JsonBlock value={r.plan} />
            </TabsContent>
            <TabsContent value="config">
              <JsonBlock value={r.config} />
            </TabsContent>
            <TabsContent value="outcome">
              <JsonBlock value={r.outcome} />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </li>
  );
};

export const ReleaseList: FC<{ releases: Release[] }> = ({ releases }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">版本历史</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {releases.length > 0 ? (
          <ul>
            {releases.map((r, i) => (
              <ReleaseItem key={r.id} release={r} last={i === releases.length - 1} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">从未部署</p>
        )}
      </CardContent>
    </Card>
  );
};
