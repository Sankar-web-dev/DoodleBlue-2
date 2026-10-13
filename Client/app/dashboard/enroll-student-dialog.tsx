"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Building2,
  GraduationCap,
  Loader2,
  Undo2,
} from "lucide-react";

import {
  enrollmentsService,
  ENROLLMENTS_LIST_KEY,
  Enrollment,
} from "@/api/enrollments.api";
import {
  coursesService,
  COURSES_LIST_KEY,
} from "@/api/courses.api";
import { Student } from "@/api/students.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_VARIANTS: Record<
  Enrollment["status"],
  "success" | "secondary" | "warning"
> = {
  ACTIVE: "success",
  COMPLETED: "secondary",
  WITHDRAWN: "warning",
};

export function EnrollStudentDialog({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const open = student !== null;
  const studentId = student?.id;
  const departmentId = student?.department.id;

  const [courseId, setCourseId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Reset the picker whenever the dialog opens for a different student.
  useEffect(() => {
    setCourseId("");
    setFormError(null);
  }, [studentId]);

  const { data: enrollmentsData, isPending: enrollmentsPending } = useQuery({
    queryKey: [...ENROLLMENTS_LIST_KEY, "student", studentId],
    queryFn: () =>
      enrollmentsService.listEnrollments({ studentId, limit: 50 }),
    enabled: open,
  });
  const enrollments = enrollmentsData?.data ?? [];

  // Only courses inside the student's own department are offered — the API
  // enforces the same rule and rejects cross-department pairings.
  const { data: coursesData, isPending: coursesPending } = useQuery({
    queryKey: [...COURSES_LIST_KEY, "dept", departmentId],
    queryFn: () =>
      coursesService.listCourses({
        departmentId,
        isActive: true,
        limit: 100,
      }),
    enabled: open,
  });
  const courses = coursesData?.data ?? [];

  const activelyEnrolledIds = new Set(
    enrollments.filter((e) => e.status === "ACTIVE").map((e) => e.course.id)
  );
  const availableCourses = courses.filter(
    (c) => !activelyEnrolledIds.has(c.id)
  );

  const enrollMutation = useMutation({
    mutationFn: () =>
      enrollmentsService.createEnrollment({ studentId: studentId!, courseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_LIST_KEY });
      setCourseId("");
      setFormError(null);
      toast.success("Student enrolled in course");
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "ALREADY_ENROLLED"
            ? "This student is already enrolled in that course."
            : error.code === "COURSE_DEPARTMENT_MISMATCH"
              ? "That course belongs to a different department."
              : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: (enrollment: Enrollment) =>
      enrollmentsService.updateEnrollmentStatus(enrollment.id, "WITHDRAWN"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENROLLMENTS_LIST_KEY });
      toast.success("Enrollment withdrawn");
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleEnroll = () => {
    if (!courseId) {
      setFormError("Pick a course first.");
      return;
    }
    setFormError(null);
    enrollMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto border-border/70 bg-card shadow-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Enroll {student?.fullName}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {student?.department.name} ({student?.department.code}) — only this
            department&apos;s courses can be assigned.
          </DialogDescription>
        </DialogHeader>

        {/* Enroll form */}
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="enroll-course">Course</Label>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Select
                value={courseId}
                onValueChange={setCourseId}
                disabled={enrollMutation.isPending || coursesPending}
              >
                <SelectTrigger
                  id="enroll-course"
                  className="h-11 w-full rounded-xl pl-10"
                >
                  <SelectValue
                    placeholder={coursesPending ? "Loading…" : "Select course"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!coursesPending && availableCourses.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {courses.length === 0
                  ? "No active courses in this department yet."
                  : "Already enrolled in every available course."}
              </p>
            )}
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="button"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            onClick={handleEnroll}
            disabled={enrollMutation.isPending || !courseId}
          >
            {enrollMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enrolling…
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4" />
                Enroll in course
              </>
            )}
          </Button>
        </div>

        {/* Current enrollments */}
        <div className="space-y-2 border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Enrollments
          </p>
          {enrollmentsPending ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))
          ) : enrollments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-xs text-muted-foreground">
              Not enrolled in any courses yet.
            </p>
          ) : (
            enrollments.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/50 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {e.course.name ?? e.course.id}
                  </p>
                  {e.course.code && (
                    <p className="font-mono text-xs text-muted-foreground">
                      {e.course.code}
                    </p>
                  )}
                </div>
                <div className="ml-3 flex shrink-0 items-center gap-2">
                  <Badge variant={STATUS_VARIANTS[e.status]}>
                    {e.status}
                  </Badge>
                  {e.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => withdrawMutation.mutate(e)}
                      disabled={
                        withdrawMutation.isPending &&
                        withdrawMutation.variables?.id === e.id
                      }
                      aria-label={`Withdraw from ${e.course.name}`}
                      title="Withdraw"
                    >
                      {withdrawMutation.isPending &&
                      withdrawMutation.variables?.id === e.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Undo2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
