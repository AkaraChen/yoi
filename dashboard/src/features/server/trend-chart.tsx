import type { FC, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const W = 100;
const H = 40;
const PAD = 2;

function buildPaths(values: number[], max: number): { line: string; area: string } {
  const step = values.length > 1 ? W / (values.length - 1) : W;
  const points = values.map((v, i) => {
    const x = i * step;
    const y = H - PAD - (Math.min(v, max) / max) * (H - PAD * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
  return { line, area: `${line} L${W},${H} L0,${H} Z` };
}

type TrendChartProps = {
  icon: ReactNode;
  label: string;
  values: number[];
  format: (v: number) => string;
  /** Fixed domain top (e.g. 100 for percents); defaults to the window peak. */
  max?: number;
};

export const TrendChart: FC<TrendChartProps> = ({ icon, label, values, format, max }) => {
  const peak = max ?? Math.max(1, ...values) * 1.1;
  const current = values.at(-1);

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <span className="text-muted-foreground">{icon}</span>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
        {current !== undefined && (
          <span className="ml-auto text-sm tabular-nums">{format(current)}</span>
        )}
      </CardHeader>
      <CardContent>
        {values.length >= 2 ? (
          <>
            <svg
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="h-20 w-full"
              role="img"
              aria-label={label}
            >
              <path d={buildPaths(values, peak).area} fill="hsl(var(--accent) / 0.12)" />
              <path
                d={buildPaths(values, peak).line}
                fill="none"
                stroke="hsl(var(--accent))"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <p className="mt-1 text-xs tabular-nums text-muted-foreground">
              峰值 {format(Math.max(...values))}
            </p>
          </>
        ) : (
          <p className="flex h-20 items-center justify-center text-xs text-muted-foreground">
            采样中，稍候出图…
          </p>
        )}
      </CardContent>
    </Card>
  );
};
