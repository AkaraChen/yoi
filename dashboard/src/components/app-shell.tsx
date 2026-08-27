import type { FC } from "react";
import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { LoginGate } from "@/features/auth/login-gate";

export const AppShell: FC = () => {
  return (
    <LoginGate>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="hidden h-12 items-center border-b px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LoginGate>
  );
};
