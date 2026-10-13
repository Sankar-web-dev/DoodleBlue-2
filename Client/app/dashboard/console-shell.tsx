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
import { RESOURCE_LABELS } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarBrand } from "./_components/sidebar-brand";
import { SidebarNav } from "./_components/sidebar-nav";
import { SidebarUserFooter } from "./_components/sidebar-user-footer";
import { RolesConsole } from "./roles-console";

export function ConsoleShell({ user }: { user: AuthUser }) {
  const items = getNavItems(user);
  const [section, setSection] = useState<SectionId>(items[0]?.id ?? "roles");

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
        </header>

        <main className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:gap-8 md:px-5 md:py-2">
          {section === "roles" ? (
            <RolesConsole />
          ) : (
            <Card className="border-border/60 bg-card/80">
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
                <h2 className="text-xl font-semibold">
                  {RESOURCE_LABELS[section]}
                </h2>
                <p className="text-sm text-muted-foreground">
                  This section is coming soon.
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
