"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ShieldCheck,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { Role } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";

import { useRoles } from "../_hooks/use-roles";
import { RoleDetailsSheet } from "./role-details-sheet";
import { DeleteRoleDialog } from "./delete-role-dialog";

export function RolesView() {
  const router = useRouter();
  const { user, isPending: userPending } = useAuthUser();
  const { can } = usePermissions(user);
  const [viewRole, setViewRole] = useState<Role | null>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);

  const { data, isPending, error, refetch } = useRoles();
  const roles = data?.data ?? [];

  const columns = useMemo<ColumnDef<Role, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Role",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {row.original.isSystem ? (
                <Lock className="h-4 w-4" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.name}</p>
              {row.original.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.isActive
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                : "bg-muted text-muted-foreground border-border/40 text-xs"
            }
          >
            {row.original.isActive ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setViewRole(row.original)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View details
            </Button>
            {can("roles", "update") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => router.push(`/roles/${row.original.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {can("roles", "delete") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteRole(row.original)}
                disabled={row.original.isSystem}
                title={
                  row.original.isSystem
                    ? "System roles cannot be deleted"
                    : undefined
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        ),
      },
    ],
    [router, can]
  );

  if (userPending) return null;
  if (!can("roles", "read")) {
    return <ForbiddenState message="You don't have permission to view roles." />;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Roles &amp; Permissions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create custom roles and define exactly what each one can access.
          </p>
        </div>
        {can("roles", "create") && (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/roles/create">
              <Plus className="mr-2 h-4 w-4" />
              New role
            </Link>
          </Button>
        )}
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

      {/* Roles table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={roles}
          sort
          filter
          filterColumn="name"
          filterPlaceHolder="Search roles…"
          pagination
        />
      )}

      {/* View details sheet */}
      <RoleDetailsSheet role={viewRole} onClose={() => setViewRole(null)} />

      {/* Delete confirm dialog */}
      <DeleteRoleDialog
        role={deleteRole}
        onClose={() => setDeleteRole(null)}
      />
    </div>
  );
}
