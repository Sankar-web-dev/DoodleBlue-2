"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { usersService, USERS_LIST_KEY } from "@/api/users.api";
import { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { CreateAdminDialog } from "./_components/create-admin-card";
import { AdminsListCard } from "./_components/admins-list-card";
import { AdminStatsCards } from "./_components/admin-stats-cards";

export function AdminConsole({ user }: { user: AuthUser }) {
  const [creating, setCreating] = useState(false);
  const { can } = usePermissions(user);

  const { data, isPending, isError } = useQuery({
    queryKey: USERS_LIST_KEY,
    queryFn: () => usersService.listUsers({ limit: 50 }),
  });

  const admins = data?.data.users ?? [];
  const total = data?.meta?.total ?? admins.length;
  const active = admins.filter((a) => a.isActive).length;
  const inactive = admins.filter((a) => !a.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Console</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Provision and manage administrator credentials and portal access.
          </p>
        </div>
        {can("admins", "create") && (
          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create admin
          </Button>
        )}
      </section>

      <AdminStatsCards
        total={total}
        active={active}
        inactive={inactive}
        isPending={isPending}
      />

      <AdminsListCard
        admins={admins}
        total={total}
        isPending={isPending}
        isError={isError}
      />

      <CreateAdminDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
