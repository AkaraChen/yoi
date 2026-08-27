import type { FC } from "react";
import { cn } from "@/lib/utils";
import type { ServiceStatus } from "@/lib/api";
import { statusDotClass, statusLabel } from "@/lib/status";

type StatusDotProps = {
  status: ServiceStatus;
  className?: string;
};

export const StatusDot: FC<StatusDotProps> = ({ status, className }) => {
  return (
    <span
      className={cn("inline-block size-2 shrink-0 rounded-full", statusDotClass[status], className)}
      aria-label={statusLabel[status]}
    />
  );
};
