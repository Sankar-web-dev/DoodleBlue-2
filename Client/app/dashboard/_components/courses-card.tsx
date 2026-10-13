"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import {
  BookOpen,
  Layers,
  Pencil,
  Trash2,
  Power,
  Loader2,
} from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
  Course,
} from "@/api/courses.api";
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
import { useDepartments } from "../_hooks/use-departments";
import {
  EditCourseDialog,
  DeleteCourseDialog,
} from "./course-dialogs";

const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

export function CoursesCard({
  canUpdate = true,
  canDelete = true,
}: {
  canUpdate?: boolean;
  canDelete?: boolean;
}) {
  const queryClient = useQueryClient();
  const { departments } = useDepartments();

  const [editing, setEditing] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<Course | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: [...COURSES_LIST_KEY, "console"],
    queryFn: () => coursesService.listCourses({ limit: 100 }),
  });
  const courses = data?.data ?? [];

  const departmentOptions = departments.map((d) => ({
    label: d.code ? `${d.code} — ${d.name}` : d.name,
    value: d.name,
  }));

  const updateMutation = useMutation({
    mutationFn: (c: Course) =>
      coursesService.updateCourse(c.id, { isActive: !c.isActive }),
    onSuccess: (_result, c) => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success(c.isActive ? "Course deactivated" : "Course activated");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleDeactivate = (c: Course) => {
    setDeleting(null);
    updateMutation.mutate(c);
  };

  const columns: ColumnDef<Course>[] = [
    {
      id: "name",
      accessorKey: "name",
      header: "Course",
      // One search box matches name OR code.
      filterFn: (row, _id, value) => {
        const q = String(value).toLowerCase();
        return (
          row.original.name.toLowerCase().includes(q) ||
          row.original.code.toLowerCase().includes(q)
        );
      },
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{c.name}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {c.code}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "department",
      accessorFn: (c) => c.department.name || "No department",
      header: "Department",
      filterFn: (row, id, value) =>
        !Array.isArray(value) ||
        value.length === 0 ||
        value.includes(row.getValue(id)),
      cell: ({ row }) =>
        row.original.department.code ? (
          <Badge variant="outline" className="font-mono">
            {row.original.department.code}
          </Badge>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      accessorFn: (c) => (c.isActive ? "Active" : "Inactive"),
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
            cell: ({ row }: { row: { original: Course } }) => {
              const c = row.original;
              const busy =
                updateMutation.isPending &&
                updateMutation.variables?.id === c.id;
              return (
                <div className="flex justify-end gap-1.5">
                  {canUpdate && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditing(c)}
                        disabled={busy}
                        aria-label={`Edit ${c.name}`}
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateMutation.mutate(c)}
                        disabled={busy}
                        aria-label={
                          c.isActive
                            ? `Deactivate ${c.name}`
                            : `Activate ${c.name}`
                        }
                        title={c.isActive ? "Deactivate" : "Activate"}
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
                      onClick={() => setDeleting(c)}
                      disabled={busy}
                      aria-label={`Delete ${c.name}`}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            },
          } satisfies ColumnDef<Course>,
        ]
      : []),
  ];

  return (
    <>
      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Courses
          </CardTitle>
          <CardDescription>
            {isPending
              ? "Loading courses…"
              : `${data?.meta?.total ?? courses.length} course${
                  (data?.meta?.total ?? courses.length) === 1 ? "" : "s"
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
              Couldn&apos;t load courses. Check the server and refresh.
            </p>
          ) : (
            <GenericTable
              columns={columns}
              data={courses}
              filter
              filterColumn="name"
              filterPlaceHolder="Search name or code…"
              filterWithSelect
              filterWithSelectFieldNames={["department", "status"]}
              filterWithSelectFieldOptions={[departmentOptions, statusOptions]}
              pagination
            />
          )}
        </CardContent>
      </Card>

      <EditCourseDialog course={editing} onClose={() => setEditing(null)} />
      <DeleteCourseDialog
        course={deleting}
        onClose={() => setDeleting(null)}
        onDeactivate={handleDeactivate}
      />
    </>
  );
}
