"use client";

import { useState } from "react";
import { Crown, UserCog } from "lucide-react";

import Link from "next/link";
import { AuthUser, getRoleLabel } from "@/api/auth.api";
import { useUser } from "../users/_hooks/use-users";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/ui/logout-button";
import { SidebarFooter } from "@/components/ui/sidebar";
import { initials } from "./console-utils";

export function SidebarUserFooter({ user: initialUser }: { user: AuthUser }) {
  const isSuper = initialUser.role === "SUPER_ADMIN";
  const RoleIcon = isSuper ? Crown : UserCog;
  const [imgFailed, setImgFailed] = useState(false);

  // Fetch the full/fresh user data using the useUser hook
  const { data: userDetail } = useUser(initialUser.id);
  const user = userDetail?.user ?? initialUser;

  // Normalize image url (handles relative paths like /uploads/...)
  const imageUrl = user.image && !imgFailed ? user.image : null;

  return (
    <SidebarFooter className="mt-auto border-t border-sidebar-border px-4 py-4 group-data-[collapsible=icon]:p-2">
      <Link
        href="/profile"
        title="View profile"
        className="mb-2 flex items-center gap-3 rounded-xl border border-sidebar-border/60 bg-sidebar-accent/40 p-2.5 transition-all hover:bg-sidebar-accent/80 hover:border-sidebar-border group-data-[collapsible=icon]:p-1.5 group-data-[collapsible=icon]:justify-center"
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={user.name}
            title={user.name}
            className="h-10 w-10 shrink-0 rounded-full border border-primary/30 object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            title={user.name}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/20 text-sm font-bold text-primary"
          >
            {initials(user.name)}
          </div>
        )}
        <div className="min-w-0 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-semibold hover:underline">{user.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {user.email}
          </p>
        </div>
      </Link>
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
        <LogoutButton
          showIcon
          title="Log out"
          className="w-full justify-start group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 [&>span]:group-data-[collapsible=icon]:hidden [&>svg]:group-data-[collapsible=icon]:mr-0"
          variant="outline"
          size="sm"
        />
      </div>
    </SidebarFooter>
  );
}
