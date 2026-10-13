"use client";

import { AuthUser } from "@/api/auth.api";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarBrand } from "./_components/sidebar-brand";
import { SidebarUserFooter } from "./_components/sidebar-user-footer";
import { RolesConsole } from "./roles-console";

export function ConsoleShell({ user }: { user: AuthUser }) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarBrand />
        <SidebarUserFooter user={user} />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden bg-ambient-mesh">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:gap-8 md:px-5 md:py-2">
          <RolesConsole />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
