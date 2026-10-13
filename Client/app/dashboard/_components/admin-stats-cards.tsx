"use client";

import { Users, UserCheck, UserX } from "lucide-react";

import { ConsoleStatsCards } from "./console-stats-cards";

export function AdminStatsCards({
  total,
  active,
  inactive,
  isPending,
}: {
  total: number;
  active: number;
  inactive: number;
  isPending: boolean;
}) {
  const stats = [
    { icon: Users, label: "Total admins", value: total },
    { icon: UserCheck, label: "Active", value: active },
    { icon: UserX, label: "Inactive", value: inactive },
  ];

  return <ConsoleStatsCards stats={stats} isPending={isPending} />;
}
