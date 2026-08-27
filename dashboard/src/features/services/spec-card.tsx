import type { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceSpec } from "@/lib/api";

type SpecCardProps = {
  spec: ServiceSpec;
};

const SpecRow: FC<{ label: string; children?: React.ReactNode }> = ({ label, children }) => {
  return (
    <div className="flex items-center justify-between gap-3 px-1 py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right font-mono text-xs">{children ?? "未声明"}</span>
    </div>
  );
};

/** SpecCard renders the spec declaration (ports, resource limits, env count,
 *  health check) from the service document — intent, not live usage. Env
 *  values are never displayed, only counted. */
export const SpecCard: FC<SpecCardProps> = ({ spec }) => {
  const ports = spec.ports ?? [];
  const resources = Object.entries(spec.resources ?? {});
  const envCount = Object.keys(spec.env ?? {}).length;
  const health = spec.health_check;
  const empty = ports.length === 0 && resources.length === 0 && envCount === 0 && !health;

  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-sm font-normal text-muted-foreground">资源声明</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border p-4 pt-1">
        {empty ? (
          <p className="py-6 text-center text-sm text-muted-foreground">未声明 spec</p>
        ) : (
          <>
            <SpecRow label="端口">
              {ports.length > 0 ? ports.join(" · ") : undefined}
            </SpecRow>
            <SpecRow label="资源限制">
              {resources.length > 0
                ? resources.map(([k, v]) => `${k} ${v}`).join(" · ")
                : undefined}
            </SpecRow>
            <SpecRow label="环境变量">
              {envCount > 0 ? `${envCount} 个（值不展示）` : undefined}
            </SpecRow>
            <SpecRow label="健康检查">
              {health?.endpoint
                ? `${health.endpoint}${health.expect ? ` → ${health.expect}` : ""}`
                : undefined}
            </SpecRow>
          </>
        )}
      </CardContent>
    </Card>
  );
};
