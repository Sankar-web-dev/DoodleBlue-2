"use client";

import { useAuthUser } from "@/lib/use-auth-user";

import { useDashboardStats } from "../_hooks/use-dashboard-stats";
import { AdminDashboard } from "./admin-dashboard";
import { MemberDashboard } from "./member-dashboard";
import { DashboardSkeleton } from "./dashboard-skeleton";

export function DashboardView() {
  const { user } = useAuthUser();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const { data, isPending, error, refetch } = useDashboardStats(isSuperAdmin);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."}
        </p>
      </div>

      {isSuperAdmin ? (
        isPending ? (
          <DashboardSkeleton />
        ) : (
          <AdminDashboard
            stats={data!}
            error={error}
            onRetry={() => refetch()}
          />
        )
      ) : (
        <MemberDashboard user={user} />
      )}
    </div>
  );
}
