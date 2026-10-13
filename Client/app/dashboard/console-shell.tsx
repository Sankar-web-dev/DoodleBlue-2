"use client";

import { useState } from "react";

import { AuthUser } from "@/api/auth.api";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getNavItems, type SectionId } from "./_components/console-nav";
import { SidebarBrand } from "./_components/sidebar-brand";
import { SidebarNav } from "./_components/sidebar-nav";
import { SidebarUserFooter } from "./_components/sidebar-user-footer";
import { SectionContent } from "./_components/section-content";
import { NotificationSheet } from "./_components/notification-sheet";

export function ConsoleShell({ user }: { user: AuthUser }) {
  const isSuper = user.role === "SUPER_ADMIN";
  const items = getNavItems(user);

  const [section, setSection] = useState<SectionId>(items[0].id);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarBrand />
        <SidebarNav items={items} section={section} onSelect={setSection} />
        <SidebarUserFooter user={user} />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden bg-ambient-mesh">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/60 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
          </div>
          {isSuper && (
            <div className="flex items-center gap-2">
              <NotificationSheet />
            </div>
          )}
        </header>

        <main className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:gap-8 md:px-5 md:py-2">
          <SectionContent section={section} user={user} />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
