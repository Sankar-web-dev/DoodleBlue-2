"use client";

import { Activity, ClipboardList } from "lucide-react";

import { AnalyticsSummary } from "@/api/analytics.api";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const STATUS_VARIANTS: Record<string, "success" | "secondary" | "warning"> = {
  ACTIVE: "success",
  COMPLETED: "secondary",
  WITHDRAWN: "warning",
};

export function RecentEnrollmentsCard({
  summary,
  isPending,
  isError,
}: {
  summary?: AnalyticsSummary;
  isPending: boolean;
  isError: boolean;
}) {
  const recent = summary?.recentEnrollments ?? [];

  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Recent enrollments
        </CardTitle>
        <CardDescription>The 5 latest student–course mappings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-2xl" />
          ))
        ) : isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load recent enrollments.
          </p>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-8 text-center">
            <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              No enrollments yet — map students to courses from the Students
              section.
            </p>
          </div>
        ) : (
          recent.map((e) => (
            <div
              key={e.id}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {e.student.fullName ?? "Student"} →{" "}
                  {e.course.name ?? "Course"}
                </p>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {e.student.studentNumber ?? ""} · {e.course.code ?? ""} ·{" "}
                  {new Date(e.enrolledAt).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[e.status] ?? "secondary"}>
                {e.status}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
