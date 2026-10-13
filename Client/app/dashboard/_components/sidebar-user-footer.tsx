"use client";

import { useState } from "react";
import { Crown, UserCog, KeyRound } from "lucide-react";

import { AuthUser, getRoleLabel } from "@/api/auth.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/ui/logout-button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { initials } from "./console-utils";
import { ChangePasswordDialog } from "./change-password-dialog";

export function SidebarUserFooter({ user }: { user: AuthUser }) {
  const isSuper = user.role === "SUPER_ADMIN";
  const RoleIcon = isSuper ? Crown : UserCog;
  const [changingPassword, setChangingPassword] = useState(false);

  return (
    <SidebarFooter className="mt-auto border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:p-2">
      <div className="mb-2 flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 px-3 py-3 group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center">
        <div
          title={user.name}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm font-bold text-primary"
        >
          {initials(user.name)}
        </div>
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
        <Badge
          className={
            isSuper
              ? "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/25 group-data-[collapsible=icon]:p-1.5"
              : "border-border bg-secondary text-secondary-foreground group-data-[collapsible=icon]:p-1.5"
          }
        >
          <RoleIcon className="h-3.5 w-3.5" />
          <span className="group-data-[collapsible=icon]:hidden">
            {getRoleLabel(user.role)}
          </span>
        </Badge>
        <Button
          title="Change password"
          className="w-full justify-start group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
          variant="outline"
          size="sm"
          onClick={() => setChangingPassword(true)}
        >
          <KeyRound className="h-4 w-4 group-data-[collapsible=icon]:mr-0 mr-2" />
          <span className="group-data-[collapsible=icon]:hidden">
            Change password
          </span>
        </Button>
        <LogoutButton
          showIcon
          title="Log out"
          className="w-full justify-start group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 [&>span]:group-data-[collapsible=icon]:hidden [&>svg]:group-data-[collapsible=icon]:mr-0"
          variant="outline"
          size="sm"
        />
      </div>
      <ChangePasswordDialog
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
      />
    </SidebarFooter>
  );
}
