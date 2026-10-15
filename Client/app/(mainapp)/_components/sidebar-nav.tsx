"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsFetching } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { NavItem } from "./console-nav";

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const isFetching = useIsFetching();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Manage
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={isActive}
                    className="h-10 rounded-xl transition-all duration-150 data-[active=true]:bg-primary/12 data-[active=true]:text-primary data-[active=true]:font-semibold data-[active=true]:shadow-xs hover:bg-sidebar-accent"
                  >
                    <Link href={item.href}>
                      {isActive && isFetching > 0 ? (
                        <Loader2 className="animate-spin text-primary" />
                      ) : (
                        <item.icon className={isActive ? "text-primary" : ""} />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
