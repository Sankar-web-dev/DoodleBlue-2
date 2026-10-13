"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, CheckCircle2, CircleOff, Plus } from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";
import { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ConsoleStatsCards } from "./_components/console-stats-cards";
import { CreateDepartmentDialog } from "./_components/create-department-card";
import { DepartmentsCard } from "./_components/departments-card";

export function DepartmentsConsole({ user }: { user: AuthUser }) {
  const { can } = usePermissions(user);
  const [creating, setCreating] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "stats"],
    queryFn: () => departmentsService.listDepartments({ limit: 100 }),
  });

  const departments = data?.data ?? [];
  const total = data?.meta?.total ?? departments.length;
  const active = departments.filter((d) => d.isActive).length;
  const inactive = departments.filter((d) => !d.isActive).length;

  const stats = [
    { icon: Layers, label: "Total departments", value: total },
    { icon: CheckCircle2, label: "Active", value: active },
    { icon: CircleOff, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic faculties, departments, and course allocations.
          </p>
        </div>
        {can("departments", "create") && (
          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create department
          </Button>
        )}
      </section>

      <ConsoleStatsCards stats={stats} isPending={isPending} />

      <DepartmentsCard
        canUpdate={can("departments", "update")}
        canDelete={can("departments", "delete")}
      />

      <CreateDepartmentDialog
        open={creating}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}
