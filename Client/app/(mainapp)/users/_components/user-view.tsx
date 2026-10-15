"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  UserCheck,
  ShieldCheck,
  KeyRound,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { User } from "@/api/users.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { useUsers } from "../_hooks/use-users";
import { UserDetailsSheet } from "./user-details-sheet";
import { DeleteUserDialog } from "./delete-user-dialog";

export function UsersView() {
  const router = useRouter();
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const { user: currentUser } = useAuthUser();
  const { can } = usePermissions(currentUser);
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const { data, isPending, error, refetch } = useUsers();
  const rawUsers = Array.isArray(data?.data)
    ? data.data
    : (data?.data as unknown as { users?: User[] })?.users ?? [];

  // Super admin details should never be visible to other roles
  const users = useMemo(
    () => (isSuperAdmin ? rawUsers : rawUsers.filter((u) => u.role !== "SUPER_ADMIN")),
    [rawUsers, isSuperAdmin]
  );

  const columns = useMemo<ColumnDef<User, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            {row.original.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.image}
                alt={row.original.name}
                className="h-8 w-8 shrink-0 rounded-full border border-primary/20 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {row.original.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{row.original.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.email}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{row.original.role}</span>
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
        accessorKey: "mustChangePassword",
        header: "Password Reset",
        cell: ({ row }) =>
          row.original.mustChangePassword ? (
            <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs">
              <KeyRound className="h-3 w-3 mr-1" />
              Pending
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Normal</span>
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
              onClick={() => setViewUser(row.original)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View details
            </Button>
            {can("users", "update") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => router.push(`/users/${row.original.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {can("users", "delete") && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteUser(row.original)}
                disabled={row.original.role === "SUPER_ADMIN"}
                title={
                  row.original.role === "SUPER_ADMIN"
                    ? "SUPER_ADMIN cannot be deleted"
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

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Provision user accounts, assign custom roles, and view access profiles.
          </p>
        </div>
        {can("users", "create") && (
          <Button asChild className="shrink-0 self-start sm:self-auto bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
            <Link href="/users/create">
              <Plus className="mr-2 h-4 w-4" />
              New user
            </Link>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading users…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load users."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Users table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={users}
          sort
          filter
          filterColumn="name"
          filterPlaceHolder="Search users "
          pagination
        />
      )}

      {/* View details sheet */}
      <UserDetailsSheet user={viewUser} onClose={() => setViewUser(null)} />

      {/* Delete user confirm dialog */}
      <DeleteUserDialog
        user={deleteUser}
        onClose={() => setDeleteUser(null)}
      />
    </div>
  );
}

export default UsersView;
