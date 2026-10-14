"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { ClubForm } from "../_components/club-form";

export default function CreateClubPage() {
  const { user, isPending } = useAuthUser();
  const { can } = usePermissions(user);

  if (isPending) return null;
  if (!can("clubs", "create")) {
    return <ForbiddenState message="You don't have permission to create clubs." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create club</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register a new club and assign its faculty coordinator.
        </p>
      </div>
      <div className="max-w-3xl">
        <ClubForm />
      </div>
    </div>
  );
}
