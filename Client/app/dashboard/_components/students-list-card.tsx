"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { BookOpen, UserRoundArrowLeft } from "lucide-react";

import { Student } from "@/api/students.api";
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
import { initials } from "./console-utils";
import { useDepartments } from "../_hooks/use-departments";


const statusOptions = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

export function StudentsListCard({
  students,
  total,
  isPending,
  isError,
  onEnroll,
  canEnroll = true,
}: {
  students: Student[];
  total: number;
  isPending: boolean;
  isError: boolean;
  onEnroll: (student: Student) => void;
  /** Whether the current user may create enrollments. Hides the Enroll column. */
  canEnroll?: boolean;
}) {
  const { departments } = useDepartments();

  const departmentOptions = departments.map((d) => ({
    label: d.code ? `${d.code} — ${d.name}` : d.name,
    value: d.name,
  }));

  const columns: ColumnDef<Student>[] = [
    {
      id: "name",
      accessorKey: "fullName",
      header: "Student",
      // One search box matches name, student number OR email.
      filterFn: (row, _id, value) => {
        const q = String(value).toLowerCase();
        return (
          row.original.fullName.toLowerCase().includes(q) ||
          row.original.studentNumber.toLowerCase().includes(q) ||
          row.original.email.toLowerCase().includes(q)
        );
      },
      cell: ({ row }) => {
        const s = row.original;
        return (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/15 text-xs font-bold text-primary">
              {initials(s.fullName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{s.fullName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">
                {s.studentNumber}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: "department",
      accessorFn: (s) => s.department.name || "No department",
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
      accessorFn: (s) => (s.status === "ACTIVE" ? "Active" : "Inactive"),
      header: "Status",
      filterFn: (row, id, value) =>
        !Array.isArray(value) ||
        value.length === 0 ||
        value.includes(row.getValue(id)),
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "ACTIVE" ? "success" : "secondary"}
        >
          {row.original.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    ...(canEnroll
      ? [
          {
            id: "actions",
            header: "Assign",
            cell: ({ row }: { row: { original: Student } }) => {
              const s = row.original;
              return (
                <div className="">
                  <Button
                    variant="ghost"
                    size="icon"
                    // className="h-8 w-8"
                    onClick={() => onEnroll(s)}
                    aria-label={`Enroll ${s.fullName} in a course`}
                    title="Enroll in course"
                  >
                    <UserRoundArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              );
            },
          } satisfies ColumnDef<Student>,
        ]
      : []),
  ];

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Students
        </CardTitle>
        <CardDescription>
          {isPending
            ? "Loading students…"
            : `${total} student${total === 1 ? "" : "s"} enrolled`}
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
            Couldn&apos;t load students. Check the server and refresh.
          </p>
        ) : (
          <GenericTable
            columns={columns}
            data={students}
            filter
            filterColumn="name"
            filterPlaceHolder="Search name, number or email…"
            filterWithSelect
            filterWithSelectFieldNames={["department", "status"]}
            filterWithSelectFieldOptions={[departmentOptions, statusOptions]}
            pagination
          />
        )}
      </CardContent>
    </Card>
  );
}
