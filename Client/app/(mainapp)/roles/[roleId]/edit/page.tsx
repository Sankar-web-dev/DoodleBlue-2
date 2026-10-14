"use client";

import { useParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useRole } from "../../_hooks/use-roles";
import { RoleForm } from "../../_components/role-form";

export default function EditRolePage() {
  const params = useParams<{ roleId: string }>();
  const { data, isPending, error, refetch } = useRole(params.roleId);
  const role = data?.role;

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading role…
      </div>
    );
  }

  if (error || !role) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error ? error.message : "Role not found."}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit role</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the name and permission matrix for &ldquo;{role.name}&rdquo;.
        </p>
      </div>
      <div className="max-w-3xl">
        <RoleForm role={role} />
      </div>
    </div>
  );
}
