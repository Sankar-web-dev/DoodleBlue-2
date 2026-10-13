"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { rolesApi, Role, ROLES_LIST_KEY } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CreateRoleCard } from "./_components/create-role-card";
import { RESOURCE_LABELS, ACTION_LABELS, Resource, Action } from "@/lib/permissions";

export function RolesConsole() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen]   = useState(false);
  const [editRole, setEditRole]       = useState<Role | null>(null);
  const [deleteRole, setDeleteRole]   = useState<Role | null>(null);

  const { data, isPending, error, refetch } = useQuery({
    queryKey: ROLES_LIST_KEY,
    queryFn: () => rolesApi.listRoles({ limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      setDeleteRole(null);
    },
  });

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
      <CreateRoleCard
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Edit dialog */}
      <CreateRoleCard
        open={!!editRole}
        onClose={() => setEditRole(null)}
        role={editRole ?? undefined}
      />

      {/* Delete confirm */}
      <Dialog open={!!deleteRole} onOpenChange={(v) => !v && setDeleteRole(null)}>
        <DialogContent className="sm:max-w-md border-border/70 bg-card/95">
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{deleteRole?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This will permanently remove the role. Users assigned to this role will lose their
              permissions immediately. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteRole(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteRole && deleteMutation.mutate(deleteRole.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Role Card ─────────────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEdit,
  onDelete,
}: {
  role: Role;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="border-border/60 bg-card/80 hover:border-primary/30 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {role.isSystem ? <Lock className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-semibold truncate">{role.name}</CardTitle>
              {role.description && (
                <CardDescription className="text-xs mt-0.5 truncate">
                  {role.description}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">System</Badge>
            )}
            <Badge
              className={
                role.isActive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs px-1.5 py-0.5"
                  : "bg-muted text-muted-foreground border-border/40 text-xs px-1.5 py-0.5"
              }
            >
              {role.isActive ? (
                <CheckCircle2 className="h-3 w-3 mr-1" />
              ) : (
                <XCircle className="h-3 w-3 mr-1" />
              )}
              {role.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Permission summary */}
        <div className="space-y-1.5">
          {role.permissions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No permissions assigned.</p>
          ) : (
            role.permissions.map((perm) => (
              <div key={perm.resource} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground/80">
                  {RESOURCE_LABELS[perm.resource as Resource] ?? perm.resource}
                </span>
                <div className="flex gap-1 flex-wrap justify-end">
                  {(["create", "read", "update", "delete"] as Action[]).map((action) => (
                    <span
                      key={action}
                      className={`rounded px-1 py-0.5 text-[10px] font-medium leading-none ${
                        perm.actions.includes(action)
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/50 text-muted-foreground/40"
                      }`}
                    >
                      {ACTION_LABELS[action][0]}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5 mr-1.5" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/40"
            onClick={onDelete}
            disabled={role.isSystem}
            title={role.isSystem ? "System roles cannot be deleted" : undefined}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
