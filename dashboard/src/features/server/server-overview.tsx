import type { FC, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Cpu,
  Gauge,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getServerHistory, getServerInfo, getServerMetrics } from "@/lib/api";
import { formatBytes, formatPercent, formatRate, formatUptime } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { TrendChart } from "@/features/server/trend-chart";

type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value?: string;
  sub?: string;
};

const MetricCard: FC<MetricCardProps> = ({ icon, label, value, sub }) => {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
        <span className="text-muted-foreground">{icon}</span>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        {value ? (
          <>
            <p className="text-2xl tabular-nums tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </>
        ) : (
          <Skeleton className="h-8 w-24" />
        )}
      </CardContent>
    </Card>
  );
};

export const ServerOverview: FC = () => {
  const info = useQuery({ queryKey: ["server-info"], queryFn: getServerInfo });
  const metrics = useQuery({
    queryKey: ["server-metrics"],
    queryFn: getServerMetrics,
    refetchInterval: 3_000,
  });
  const history = useQuery({
    queryKey: ["server-history"],
    queryFn: getServerHistory,
    refetchInterval: 5_000,
  });
  const m = metrics.data;
  const points = history.data?.points ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        title="服务器概览"
        description={
          info.data ? (
            <>
              {[info.data.hostname, info.data.os, info.data.kernel && `内核 ${info.data.kernel}`, info.data.arch, info.data.virtualization]
                .filter(Boolean)
                .join(" · ")}
            </>
          ) : info.isError ? (
            "主机信息暂时不可用"
          ) : (
            <Skeleton className="mt-1 inline-block h-4 w-72" />
          )
        }
      />

      <Tabs defaultValue="current">
        <TabsList className="rounded-full">
          <TabsTrigger value="current" className="rounded-full">
            当前
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-full">
            趋势
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              icon={<Cpu className="size-4" />}
              label="CPU"
              value={m && formatPercent(m.cpuPercent)}
              sub={info.data && `${info.data.cpuModel} · ${info.data.cpuCores} 核`}
            />
            <MetricCard
              icon={<MemoryStick className="size-4" />}
              label="内存"
              value={m && formatPercent((m.memUsed / m.memTotal) * 100)}
              sub={m && `${formatBytes(m.memUsed)} / ${formatBytes(m.memTotal)}`}
            />
            <MetricCard
              icon={<HardDrive className="size-4" />}
              label="磁盘"
              value={m && formatPercent((m.diskUsed / m.diskTotal) * 100)}
              sub={m && `${formatBytes(m.diskUsed)} / ${formatBytes(m.diskTotal)}`}
            />
            <MetricCard
              icon={<Gauge className="size-4" />}
              label="负载"
              value={m && `${m.load1.toFixed(2)} / ${m.load5.toFixed(2)} / ${m.load15.toFixed(2)}`}
              sub="1 / 5 / 15 分钟"
            />
            <MetricCard
              icon={<ArrowUp className="size-4" />}
              label="上行"
              value={m && formatRate(m.netUpRate)}
              sub={m && `累计 ${formatBytes(m.netUpTotal)}`}
            />
            <MetricCard
              icon={<ArrowDown className="size-4" />}
              label="下行"
              value={m && formatRate(m.netDownRate)}
              sub={m && `累计 ${formatBytes(m.netDownTotal)}`}
            />
            <MetricCard
              icon={<Activity className="size-4" />}
              label="连接"
              value={m && `TCP ${m.tcpConns} · UDP ${m.udpConns}`}
              sub={m && `${m.processCount} 个进程`}
            />
            <MetricCard
              icon={<MemoryStick className="size-4" />}
              label="Swap"
              value={m && formatPercent((m.swapUsed / m.swapTotal) * 100)}
              sub={m && `${formatBytes(m.swapUsed)} / ${formatBytes(m.swapTotal)}`}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {m && (
              <>
                已运行 {formatUptime(m.uptimeSec)}
                {info.data?.bootTime && (
                  <>
                    {" "}
                    · 启动于{" "}
                    {new Date(info.data.bootTime).toLocaleString("zh-CN", { hour12: false })}
                  </>
                )}{" "}
                · 每 3 秒自动刷新
              </>
            )}
          </p>
        </TabsContent>

        <TabsContent value="trends" className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TrendChart
              icon={<Cpu className="size-4" />}
              label="CPU"
              values={points.map((p) => p.cpuPercent)}
              format={formatPercent}
              max={100}
            />
            <TrendChart
              icon={<MemoryStick className="size-4" />}
              label="内存"
              values={points.map((p) => p.memPercent)}
              format={formatPercent}
              max={100}
            />
            <TrendChart
              icon={<ArrowUp className="size-4" />}
              label="上行"
              values={points.map((p) => p.netUpRate)}
              format={formatRate}
            />
            <TrendChart
              icon={<ArrowDown className="size-4" />}
              label="下行"
              values={points.map((p) => p.netDownRate)}
              format={formatRate}
            />
            <TrendChart
              icon={<Gauge className="size-4" />}
              label="负载（1 分钟）"
              values={points.map((p) => p.load1)}
              format={(v) => v.toFixed(2)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            近 1 小时 · 5 秒采样 · 探针重启后历史清零
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
};
