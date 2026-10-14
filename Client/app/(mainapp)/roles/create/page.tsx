"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { RoleForm } from "../_components/role-form";

export default function CreateRolePage() {
  const { user, isPending } = useAuthUser();
  const { can } = usePermissions(user);

  if (isPending) return null;
  if (!can("roles", "create")) {
    return <ForbiddenState message="You don't have permission to create roles." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create role</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Define a new role and choose exactly what it can access.
        </p>
      </div>
      <div className="max-w-3xl">
        <RoleForm />
      </div>
    </div>
  );
}
