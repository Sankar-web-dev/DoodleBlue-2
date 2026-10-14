"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  UserCheck,
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

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useMembershipRows, type MembershipRow } from "../_hooks/use-memberships";
import { MembershipDetailsSheet } from "./membership-details-sheet";
import { DeleteMembershipDialog } from "./delete-membership-dialog";

export function MembershipsView() {
  const router = useRouter();
  const [viewMembership, setViewMembership] = useState<MembershipRow | null>(
    null
  );
  const [deleteMembership, setDeleteMembership] =
    useState<MembershipRow | null>(null);

  const { data, isPending, error, refetch } = useMembershipRows();

  const columns = useMemo<ColumnDef<MembershipRow, unknown>[]>(
    () => [
      {
        accessorKey: "studentName",
        header: "Member",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.studentName}
              </p>
              {row.original.studentEmail && (
                <p className="truncate text-xs text-muted-foreground">
                  {row.original.studentEmail}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "clubName",
        header: "Club",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.clubName}
            </p>
            {row.original.clubDepartment && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.clubDepartment}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "membershipRole",
        header: "Club role",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.membershipRole === "COORDINATOR"
                ? "default"
                : "outline"
            }
            className="text-xs"
          >
            {row.original.membershipRole === "COORDINATOR"
              ? "Coordinator"
              : "Member"}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            className={
              row.original.status === "ACTIVE"
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                : "bg-muted text-muted-foreground border-border/40 text-xs"
            }
          >
            {row.original.status === "ACTIVE" ? (
              <CheckCircle2 className="h-3 w-3 mr-1" />
            ) : (
              <XCircle className="h-3 w-3 mr-1" />
            )}
            {row.original.status === "ACTIVE" ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "assignedAt",
        header: "Assigned",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.assignedAt).toLocaleDateString()}
          </span>
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
              onClick={() => setViewMembership(row.original)}
            >
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View details
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={() =>
                router.push(`/club-membership/${row.original.id}/edit`)
              }
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteMembership(row.original)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Club Memberships
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Map students to clubs and manage coordinators.
          </p>
        </div>
        <Button asChild className="shrink-0 self-start sm:self-auto">
          <Link href="/club-membership/create">
            <Plus className="mr-2 h-4 w-4" />
            Add membership
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading memberships…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load memberships."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Memberships table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={data}
          sort
          filter
          filterColumn="studentName"
          filterPlaceHolder="Search members…"
          filterWithSelect
          filterWithSelectFieldNames={["membershipRole", "status"]}
          filterWithSelectFieldOptions={[
            [
              { label: "Member", value: "MEMBER" },
              { label: "Coordinator", value: "COORDINATOR" },
            ],
            [
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ],
          ]}
          pagination
        />
      )}

      {/* View details sheet */}
      <MembershipDetailsSheet
        membership={viewMembership}
        onClose={() => setViewMembership(null)}
      />

      {/* Delete confirm dialog */}
      <DeleteMembershipDialog
        membership={deleteMembership}
        onClose={() => setDeleteMembership(null)}
      />
    </div>
  );
}
