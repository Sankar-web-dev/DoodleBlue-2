"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, CheckCircle2, CircleOff, Plus } from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
} from "@/api/courses.api";
import { AuthUser } from "@/api/auth.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ConsoleStatsCards } from "./_components/console-stats-cards";
import { CreateCourseDialog } from "./_components/create-course-card";
import { CoursesCard } from "./_components/courses-card";

export function CoursesConsole({ user }: { user: AuthUser }) {
  const { can } = usePermissions(user);
  const [creating, setCreating] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: [...COURSES_LIST_KEY, "stats"],
    queryFn: () => coursesService.listCourses({ limit: 100 }),
  });

  const courses = data?.data ?? [];
  const total = data?.meta?.total ?? courses.length;
  const active = courses.filter((c) => c.isActive).length;
  const inactive = courses.filter((c) => !c.isActive).length;

  const stats = [
    { icon: Layers, label: "Total courses", value: total },
    { icon: CheckCircle2, label: "Active", value: active },
    { icon: CircleOff, label: "Inactive", value: inactive },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Academic curriculum, department course allocations, and course states.
          </p>
        </div>
        {can("courses", "create") && (
          <Button
            onClick={() => setCreating(true)}
            className="h-11 rounded-xl bg-primary px-5 text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Create course
          </Button>
        )}
      </section>

      <ConsoleStatsCards stats={stats} isPending={isPending} />

      <CoursesCard
        canUpdate={can("courses", "update")}
        canDelete={can("courses", "delete")}
      />

      <CreateCourseDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}
