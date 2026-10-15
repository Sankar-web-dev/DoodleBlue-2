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
import { SidebarNav } from "./_components/sidebar-nav";
import { SidebarUserFooter } from "./_components/sidebar-user-footer";
import { ChangePasswordDialog } from "./_components/change-password-dialog";
import { useConsoleNav } from "./_components/use-console-nav";

export function ConsoleShell({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const items = useConsoleNav(user);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarBrand />
        <SidebarNav items={items} />
        <SidebarUserFooter user={user} />
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 overflow-x-hidden bg-ambient-mesh">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border/80 bg-card/75 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="hover:bg-accent hover:text-accent-foreground" />
          </div>
        </header>

        <main className="flex min-h-[calc(100vh-4rem)] flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </SidebarInset>

      {/* Temporary-password accounts must set a new password before using the
          app — non-dismissable until the flag clears (also enforced by the
          server via PASSWORD_CHANGE_REQUIRED). */}
      {user.mustChangePassword && (
        <ChangePasswordDialog open onClose={() => {}} />
      )}
    </SidebarProvider>
  );
}
