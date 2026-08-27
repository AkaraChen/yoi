import type { FC } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getService } from "@/lib/api";
import { formatRelative } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { StatusDot } from "@/components/status-dot";
import { statusLabel } from "@/lib/status";
import { EventLog } from "@/features/services/event-log";
import { ReleaseList } from "@/features/services/release-list";
import { SpecCard } from "@/features/services/spec-card";
import { ServiceRail } from "@/features/services/service-rail";

export const ServiceDetail: FC = () => {
  const { serviceId = "" } = useParams();
  const service = useQuery({
    queryKey: ["services", serviceId],
    queryFn: () => getService(serviceId),
  });

  if (service.data === null) {
    return (
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl tracking-tight">服务不存在</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          没有找到 ID 为「{serviceId}」的服务，它可能已被移除。
        </p>
      </div>
    );
  }

  const s = service.data;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      {s ? (
        <>
          <PageHeader
            leading={<StatusDot status={s.status} className="size-2.5" />}
            title={s.name}
            description={
              <>
                {statusLabel[s.status]}
                {s.createdAt && <> · 创建于 {formatRelative(s.createdAt)}</>}
              </>
            }
          />
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_260px]">
            <div className="flex min-w-0 flex-col gap-4">
              <SpecCard spec={s.spec} />
              <ReleaseList releases={s.releases} />
              <EventLog events={s.events} />
            </div>
            <ServiceRail service={s} />
          </div>
        </>
      ) : (
        <>
          <Skeleton className="h-8 w-40" />
          <div className="grid items-start gap-4 lg:grid-cols-[1fr_260px]">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-44 w-full" />
              <Skeleton className="h-44 w-full" />
            </div>
            <Skeleton className="h-44 w-full" />
          </div>
        </>
      )}
    </div>
  );
};
