"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Building2,
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

import type { Club } from "@/api/clubs.api";
import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useClubs, useApproveClub } from "../_hooks/use-clubs";
import { ClubDetailsSheet } from "./club-details-sheet";
import { DeleteClubDialog } from "./delete-club-dialog";

export function ClubsView() {
  const router = useRouter();
  const [viewClub, setViewClub] = useState<Club | null>(null);
  const [deleteClub, setDeleteClub] = useState<Club | null>(null);

  const { user } = useAuthUser();
  const { can } = usePermissions(user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const approveMutation = useApproveClub();

  const { data, isPending, error, refetch } = useClubs();
  const clubs = data?.data ?? [];

  const columns = useMemo<ColumnDef<Club, unknown>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Club",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            {row.original.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.original.logoUrl}
                alt={`${row.original.name} logo`}
                className="h-8 w-8 shrink-0 rounded-lg border border-border/60 object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </div>
            )}
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
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.department}
          </span>
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
        cell: ({ row }) => {
          // Faculty may only edit/delete clubs they coordinate.
          const isOwner =
            isSuperAdmin ||
            row.original.facultyCoordinatorId === user?.id;
          return (
          <div className="flex items-center justify-end gap-1">
            {isSuperAdmin && !row.original.isActive && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-primary hover:bg-primary/10 hover:text-primary"
                disabled={approveMutation.isPending}
                onClick={() =>
                  approveMutation.mutate(row.original.id, {
                    onSuccess: () => toast.success("Club approved"),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() => setViewClub(row.original)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View details
            </Button>
            {can("clubs", "update") && isOwner && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => router.push(`/clubs/${row.original.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            )}
            {can("clubs", "delete") && isOwner && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteClub(row.original)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          );
        },
      },
    ],
    [router, can, isSuperAdmin, approveMutation, user?.id]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clubs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage college clubs and their coordinators.
          </p>
        </div>
        {can("clubs", "create") && (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/clubs/create">
              <Plus className="mr-2 h-4 w-4" />
              New club
            </Link>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading clubs…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error ? error.message : "Failed to load clubs."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Clubs table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={clubs}
          sort
          filter
          filterColumn="name"
          filterPlaceHolder="Search clubs…"
          pagination
        />
      )}

      {/* View details sheet */}
      <ClubDetailsSheet club={viewClub} onClose={() => setViewClub(null)} />

      {/* Delete confirm dialog */}
      <DeleteClubDialog
        club={deleteClub}
        onClose={() => setDeleteClub(null)}
      />
    </div>
  );
}
