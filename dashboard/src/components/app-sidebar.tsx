import type { FC } from "react";
import { NavLink, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Server } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusDot } from "@/components/status-dot";
import { getServerMetrics, getServices, getServicesLive } from "@/lib/api";
import { formatPercent } from "@/lib/format";

export const AppSidebar: FC = () => {
  const location = useLocation();
  const metrics = useQuery({
    queryKey: ["server-metrics"],
    queryFn: getServerMetrics,
    refetchInterval: 3_000,
  });
  const services = useQuery({ queryKey: ["services"], queryFn: getServices });
  const live = useQuery({
    queryKey: ["services-live"],
    queryFn: getServicesLive,
    refetchInterval: 30_000,
  });
  const liveById = new Map((live.data ?? []).map((row) => [row.id, row]));

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-3">
        <span className="text-sm font-medium tracking-tight">
          Yoi <span className="text-accent">·</span> 面板
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>服务器</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/"}>
                  <NavLink to="/">
                    <Server />
                    <span>概览</span>
                    <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                      {metrics.data ? (
                        <>
                          <Gauge className="mr-1 inline size-3 align-[-2px]" />
                          {formatPercent(metrics.data.cpuPercent)}
                        </>
                      ) : (
                        <Skeleton className="inline-block h-3 w-8" />
                      )}
                    </span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>服务</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {services.data ? (
                services.data.length > 0 ? (
                  services.data.map((service) => (
                    <SidebarMenuItem key={service.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={location.pathname === `/services/${service.id}`}
                      >
                        <NavLink to={`/services/${service.id}`}>
                          {live.isPending ? (
                            <Skeleton className="size-2 rounded-full" />
                          ) : (
                            <StatusDot status={liveById.get(service.id)?.status ?? "unknown"} />
                          )}
                          <span>{service.name}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                ) : (
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <span className="text-muted-foreground">暂无服务</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              ) : (
                Array.from({ length: 3 }, (_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuButton disabled>
                      <Skeleton className="size-2 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <span className="text-xs text-muted-foreground">仅本机访问 · 已认证</span>
      </SidebarFooter>
    </Sidebar>
  );
};
