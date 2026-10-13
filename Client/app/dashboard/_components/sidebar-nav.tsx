"use client";

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
import type { NavItem, SectionId } from "./console-nav";

export function SidebarNav({
  items,
  section,
  onSelect,
}: {
  items: NavItem[];
  section: SectionId;
  onSelect: (id: SectionId) => void;
}) {
  const isFetching = useIsFetching();

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
          Manage
        </SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  tooltip={item.label}
                  isActive={section === item.id}
                  onClick={() => onSelect(item.id)}
                  className="h-10 data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-semibold"
                >
                  {section === item.id && isFetching > 0 ? (
                    <Loader2 className="animate-spin text-primary" />
                  ) : (
                    <item.icon
                      className={section === item.id ? "text-primary" : ""}
                    />
                  )}
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  );
}
