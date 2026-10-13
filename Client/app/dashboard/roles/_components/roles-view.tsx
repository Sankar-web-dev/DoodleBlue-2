"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Loader2, AlertCircle, RefreshCw } from "lucide-react";

import type { Role } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useRoles } from "../_hooks/use-roles";
import { RoleCard } from "./role-card";
import { RoleFormDialog } from "./role-form-dialog";
import { DeleteRoleDialog } from "./delete-role-dialog";

export function RolesView() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const { data, isPending, error, refetch } = useRoles();
  const roles = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create custom roles and define exactly what each one can access.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0 self-start sm:self-auto">
          <Plus className="mr-2 h-4 w-4" />
          New role
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load roles."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isPending && !error && roles.length === 0 && (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No roles yet.</p>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Create first role
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Role cards */}
      {roles.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => setEditRole(role)}
              onDelete={() => setDeleteRole(role)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <RoleFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit dialog */}
      <RoleFormDialog
        open={!!editRole}
        onClose={() => setEditRole(null)}
        role={editRole ?? undefined}
      />

      {/* Delete confirm dialog */}
      <DeleteRoleDialog
        role={deleteRole}
        onClose={() => setDeleteRole(null)}
      />
    </div>
  );
}
