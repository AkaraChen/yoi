import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Subscribe to store-change pushes and refetch documents (not live). */
export function useStoreSocket() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${proto}//${location.host}/api/ws`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as { type?: string };
        if (msg.type !== "store") {
          return;
        }
      } catch {
        return;
      }
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      void queryClient.invalidateQueries({ queryKey: ["service"] });
      void queryClient.invalidateQueries({ queryKey: ["services-live"] });
      void queryClient.invalidateQueries({ queryKey: ["service-live"] });
    };
    return () => ws.close();
  }, [queryClient]);
}
