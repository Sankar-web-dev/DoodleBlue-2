"use client";

import { GraduationCap } from "lucide-react";

import { SidebarHeader } from "@/components/ui/sidebar";

export function SidebarBrand() {
  return (
    <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:p-2">
      <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
          <GraduationCap className="h-5 w-5" />
        </div>
        <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
          CampusLMS
        </span>
      </div>
    </SidebarHeader>
  );
}
