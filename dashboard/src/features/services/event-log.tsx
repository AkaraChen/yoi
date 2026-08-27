import type { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceEvent } from "@/lib/api";
import { formatRelative } from "@/lib/format";

type EventLogProps = {
  events: ServiceEvent[];
};

const EventItem: FC<{ event: ServiceEvent; last: boolean }> = ({ event, last }) => {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      {!last && <span className="absolute left-[5px] top-4 h-full w-px bg-border" />}
      <span className="mt-1.5 size-[11px] shrink-0 rounded-full border-2 border-border bg-secondary" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Badge variant="outline" className="font-mono font-normal">
            {event.kind}
          </Badge>
          <span className="min-w-0">{event.summary}</span>
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-muted-foreground/70">
          {event.actor} · {formatRelative(event.ts)}
        </p>
      </div>
    </li>
  );
};

export const EventLog: FC<EventLogProps> = ({ events }) => {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-normal text-muted-foreground">事件时间线</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {events.length > 0 ? (
          <ul className="px-1 pt-1">
            {events.map((event, i) => (
              <EventItem key={event.id} event={event} last={i === events.length - 1} />
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">暂无事件</p>
        )}
      </CardContent>
    </Card>
  );
};
