"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Users } from "lucide-react";

import { ListedUser } from "@/api/users.api";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/generic-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { initials } from "./console-utils";

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

const columns: ColumnDef<ListedUser>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    // One search box matches name OR email.
    filterFn: (row, _id, value) => {
      const q = String(value).toLowerCase();
      return (
        row.original.name.toLowerCase().includes(q) ||
        row.original.email.toLowerCase().includes(q)
      );
    },
    cell: ({ row }) => {
      const admin = row.original;
      return (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-xs font-bold text-primary">
            {initials(admin.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{admin.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {admin.email}
            </p>
          </div>
        </div>
      );
    },
  },
  {
    id: "status",
    accessorFn: (a) => (a.isActive ? "Active" : "Inactive"),
    header: "Status",
    filterFn: (row, id, value) =>
      !Array.isArray(value) ||
      value.length === 0 ||
      value.includes(row.getValue(id)),
    cell: ({ row }) => (
      <Badge variant={row.original.isActive ? "success" : "secondary"}>
        {row.original.isActive ? "Active" : "Inactive"}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(row.original.createdAt)}
      </span>
    ),
  },
];

export function AdminsListCard({
  admins,
  total,
  isPending,
  isError,
}: {
  admins: ListedUser[];
  total: number;
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
    
      <CardContent>
        {isPending ? (
          <div className="space-y-3 py-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load admins. Check the server and refresh.
          </p>
        ) : (
          <GenericTable
            columns={columns}
            data={admins}
            filter
            filterColumn="name"
            filterPlaceHolder="Search name or email…"
            filterWithSelect
            filterWithSelectFieldNames={["status"]}
            filterWithSelectFieldOptions={[statusOptions]}
            pagination
          />
        )}
      </CardContent>
    </Card>
  );
}
