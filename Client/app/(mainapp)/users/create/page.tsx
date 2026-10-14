"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { UserForm } from "../_components/user-form";

export default function CreateUserPage() {
  const { user, isPending } = useAuthUser();
  const { can } = usePermissions(user);

  if (isPending) return null;
  if (!can("users", "create")) {
    return <ForbiddenState message="You don't have permission to create users." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create user</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Provision a new account with an active role and a temporary password.
        </p>
      </div>
      <div className="max-w-3xl">
        <UserForm />
      </div>
    </div>
  );
}
