"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  Building2,
  Layers,
  Pencil,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
  Department,
} from "@/api/departments.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import GenericTable from "@/components/generic-table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  EditDepartmentDialog,
  DeleteDepartmentDialog,
} from "./department-dialogs";

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

export function DepartmentsCard({
  canUpdate = true,
  canDelete = true,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState<Department | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "console"],
    queryFn: () => departmentsService.listDepartments({ limit: 100 }),
  });
  const departments = data?.data ?? [];

  const updateMutation = useMutation({
    mutationFn: (d: Department) =>
      departmentsService.updateDepartment(d.id, { isActive: !d.isActive }),
    onSuccess: (_result, d) => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success(d.isActive ? "Department deactivated" : "Department activated");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleDeactivate = (d: Department) => {
    setDeleting(null);
    updateMutation.mutate(d);
  };

  const columns: ColumnDef<Department>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Name",
      // One search box matches name OR code.
      filterFn: (row, _id, value) => {
        const q = String(value).toLowerCase();
        return (
          row.original.name.toLowerCase().includes(q) ||
          row.original.code.toLowerCase().includes(q)
        );
      },
      cell: ({ row }) => {
        const d = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {d.code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "status",
      accessorFn: (d) => (d.isActive ? "Active" : "Inactive"),
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
    ...(canUpdate || canDelete
      ? [
          {
            id: "actions",
            header: "",
            cell: ({ row }: { row: { original: Department } }) => {
              const d = row.original;
              const busy =
                updateMutation.isPending &&
                updateMutation.variables?.id === d.id;
              return (
                <div className="flex justify-end gap-1.5">
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(d)}
                        disabled={busy}
                        aria-label={`Rename ${d.name}`}
                        title="Rename"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateMutation.mutate(d)}
                        disabled={busy}
                        aria-label={
                          d.isActive
                            ? `Deactivate ${d.name}`
                            : `Activate ${d.name}`
                        }
                        title={d.isActive ? "Deactivate" : "Activate"}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                    </>
                  )}
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(d)}
                      disabled={busy}
                      aria-label={`Delete ${d.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            },
          } satisfies ColumnDef<Department>,
        ]
      : []),
  ];

  return (
    <>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Departments
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Loading departments…"
              : `${data?.meta?.total ?? departments.length} department${
                  (data?.meta?.total ?? departments.length) === 1 ? "" : "s"
                } on record`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              Couldn&apos;t load departments. Check the server and refresh.
            </p>
          ) : (
            <GenericTable
              columns={columns}
              data={departments}
              filter
              filterColumn="name"
              filterPlaceHolder="Search name or code…"
              filterWithSelect
              filterWithSelectFieldNames={["status"]}
              filterWithSelectFieldOptions={[statusOptions]}
              pagination
            />
          )}
        </CardContent>
      </Card>

      <EditDepartmentDialog
        department={editing}
        onClose={() => setEditing(null)}
      />
      <DeleteDepartmentDialog
        department={deleting}
        onClose={() => setDeleting(null)}
        onDeactivate={handleDeactivate}
      />
    </>
  );
}
