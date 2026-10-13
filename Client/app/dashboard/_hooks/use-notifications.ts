"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { enrollmentsService, ENROLLMENTS_LIST_KEY } from "@/api/enrollments.api";
import { studentsService, STUDENTS_LIST_KEY } from "@/api/students.api";
import { usersService, USERS_LIST_KEY } from "@/api/users.api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type NotificationKind =
  | "enrollment_created"
  | "enrollment_completed"
  | "enrollment_withdrawn"
  | "student_created"
  | "student_inactive"
  | "admin_created";

export interface ActivityNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  timestamp: string;
  /** actor role who triggered the action */
  actor: "ADMIN" | "SUPER_ADMIN" | "STUDENT" | "SYSTEM";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNotifications() {
  // Fetch recent enrollments (latest 20)
  const enrollmentsQuery = useQuery({
    queryKey: [...ENROLLMENTS_LIST_KEY, "notifications"],
    queryFn: () => enrollmentsService.listEnrollments({ limit: 20, page: 1 }),
    staleTime: 30_000,
    refetchInterval: 60_000, // auto-refresh every minute
  });

  // Fetch recent students (latest 20)
  const studentsQuery = useQuery({
    queryKey: [...STUDENTS_LIST_KEY, "notifications"],
    queryFn: () => studentsService.listStudents({ limit: 20, page: 1 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // Fetch admin-type accounts (server already excludes SUPER_ADMIN + students)
  const adminsQuery = useQuery({
    queryKey: [...USERS_LIST_KEY, "notifications", "admins"],
    queryFn: () => usersService.listUsers({ limit: 20, page: 1 }),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const notifications = useMemo<ActivityNotification[]>(() => {
    const items: ActivityNotification[] = [];

    // ── Enrollment activities ──────────────────────────────────────────────────
    const enrollments = enrollmentsQuery.data?.data ?? [];
    for (const e of enrollments) {
      const studentName = e.student.fullName ?? e.student.studentNumber ?? "A student";
      const courseName = e.course.name ?? e.course.code ?? "a course";

      if (e.status === "ACTIVE") {
        items.push({
          id: `enrollment-active-${e.id}`,
          kind: "enrollment_created",
          title: "New Enrollment",
          description: `${studentName} was enrolled in ${courseName}.`,
          timestamp: e.enrolledAt,
          actor: "ADMIN",
        });
      } else if (e.status === "COMPLETED") {
        items.push({
          id: `enrollment-completed-${e.id}`,
          kind: "enrollment_completed",
          title: "Enrollment Completed",
          description: `${studentName} completed ${courseName}.`,
          timestamp: e.updatedAt,
          actor: "ADMIN",
        });
      } else if (e.status === "WITHDRAWN") {
        items.push({
          id: `enrollment-withdrawn-${e.id}`,
          kind: "enrollment_withdrawn",
          title: "Enrollment Withdrawn",
          description: `${studentName} was withdrawn from ${courseName}.`,
          timestamp: e.updatedAt,
          actor: "ADMIN",
        });
      }
    }

    // ── Student activities ─────────────────────────────────────────────────────
    const students = studentsQuery.data?.data ?? [];
    for (const s of students) {
      items.push({
        id: `student-created-${s.id}`,
        kind: "student_created",
        title: "Student Registered",
        description: `${s.fullName} (${s.studentNumber}) was added to ${s.department?.name ?? "a department"}.`,
        timestamp: s.createdAt,
        actor: "ADMIN",
      });

      if (s.status === "INACTIVE") {
        items.push({
          id: `student-inactive-${s.id}`,
          kind: "student_inactive",
          title: "Student Deactivated",
          description: `${s.fullName}'s account was set to inactive.`,
          timestamp: s.updatedAt,
          actor: "ADMIN",
        });
      }
    }

    // ── Admin account activities ───────────────────────────────────────────────
    const admins = adminsQuery.data?.data?.users ?? [];
    for (const a of admins) {
      items.push({
        id: `admin-created-${a.id}`,
        kind: "admin_created",
        title: "Admin Account Created",
        description: `${a.name} (${a.email}) was provisioned as Admin.`,
        timestamp: a.createdAt,
        actor: "SUPER_ADMIN",
      });
    }

    // Sort newest first
    items.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return items;
  }, [enrollmentsQuery.data, studentsQuery.data, adminsQuery.data]);

  const isPending =
    enrollmentsQuery.isPending ||
    studentsQuery.isPending ||
    adminsQuery.isPending;

  const isError =
    enrollmentsQuery.isError ||
    studentsQuery.isError ||
    adminsQuery.isError;

  const refetch = () => {
    enrollmentsQuery.refetch();
    studentsQuery.refetch();
    adminsQuery.refetch();
  };

  return { notifications, isPending, isError, refetch };
}
