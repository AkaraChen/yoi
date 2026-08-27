import type { FC } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { AppShell } from "@/components/app-shell";
import { ServerOverview } from "@/features/server/server-overview";
import { ServiceDetail } from "@/features/services/service-detail";

export const AppRouter: FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ServerOverview />} />
          <Route path="services/:serviceId" element={<ServiceDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
