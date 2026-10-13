"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, UserCheck, UserX, Plus } from "lucide-react";

import {
  studentsService,
  STUDENTS_LIST_KEY,
  Student,
} from "@/api/students.api";
import { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ConsoleStatsCards } from "./_components/console-stats-cards";
import { CreateStudentDialog } from "./_components/create-student-card";
import { StudentsListCard } from "./_components/students-list-card";
import { EnrollStudentDialog } from "./enroll-student-dialog";

export function StudentsConsole({ user }: { user: AuthUser }) {
  const { can } = usePermissions(user);
  const [creating, setCreating] = useState(false);
  const [enrolling, setEnrolling] = useState<Student | null>(null);

  const { data, isPending, isError } = useQuery({
    queryKey: STUDENTS_LIST_KEY,
    queryFn: () => studentsService.listStudents({ limit: 100 }),
  });

  const students = data?.data ?? [];
  const total = data?.meta?.total ?? students.length;
  const active = students.filter((s) => s.status === "ACTIVE").length;
  const inactive = students.filter((s) => s.status === "INACTIVE").length;

  const stats = [
    { icon: BookOpen, label: "Total students", value: total },
    { icon: UserCheck, label: "Active", value: active },
    { icon: UserX, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enroll students, map them to academic departments, and manage accounts.
          </p>
        </div>
        {can("students", "create") && (
          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create student
          </Button>
        )}
      </section>

      <ConsoleStatsCards stats={stats} isPending={isPending} />

      <StudentsListCard
        students={students}
        total={total}
        isPending={isPending}
        isError={isError}
        onEnroll={setEnrolling}
        canEnroll={can("enrollments", "create")}
      />

      <CreateStudentDialog open={creating} onClose={() => setCreating(false)} />
      <EnrollStudentDialog
        student={enrolling}
        onClose={() => setEnrolling(null)}
      />
    </div>
  );
}
