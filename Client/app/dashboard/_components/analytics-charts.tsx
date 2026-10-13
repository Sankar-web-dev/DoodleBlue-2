"use client";

import { PieChart } from "lucide-react";

import { AnalyticsSummary } from "@/api/analytics.api";
import { BarChart } from "@/components/ui/bar-chart";
import { DonutChart } from "@/components/ui/donut-chart";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const CHART_COLORS = {
  active: "oklch(0.5553 0.1455 48.9975)", // solar primary
  withdrawn: "oklch(0.4437 0.1613 26.8994)", // destructive
  students: "oklch(0.5553 0.1455 48.9975)", // solar primary
  departments: "oklch(0.6806 0.1423 75.8340)", // dusk amber
  courses: "oklch(0.5538 0.1207 66.4416)", // accent
  enrollments: "oklch(0.8276 0.0752 74.4400)", // secondary
};

function ChartCard({
  title,
  description,
  isPending,
  isError,
  children,
}: {
  title: string;
  description: string;
  isPending: boolean;
  isError: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/70 bg-card/95 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[220px] items-center justify-center">
        {isPending ? (
          <Skeleton className="h-[180px] w-[180px] rounded-full" />
        ) : isError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Couldn&apos;t load chart data.
          </p>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({
  summary,
  isPending,
  isError,
}: {
  summary?: AnalyticsSummary;
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <ChartCard
        title="Student status"
        description="Active versus inactive student accounts."
        isPending={isPending}
        isError={isError}
      >
        <BarChart
          ariaLabel="Active versus inactive students"
          bars={[
            {
              label: "Active",
              value: summary?.students.active ?? 0,
              color: CHART_COLORS.active,
            },
            {
              label: "Inactive",
              value: summary?.students.inactive ?? 0,
              color: CHART_COLORS.withdrawn,
            },
          ]}
        />
      </ChartCard>

      <ChartCard
        title="Records split"
        description="Share of all records by resource."
        isPending={isPending}
        isError={isError}
      >
        <DonutChart
          centerLabel="records"
          slices={[
            {
              label: "Students",
              value: summary?.students.total ?? 0,
              color: CHART_COLORS.students,
            },
            {
              label: "Departments",
              value: summary?.departments.total ?? 0,
              color: CHART_COLORS.departments,
            },
            {
              label: "Courses",
              value: summary?.courses.total ?? 0,
              color: CHART_COLORS.courses,
            },
            {
              label: "Enrollments",
              value: summary?.enrollments.total ?? 0,
              color: CHART_COLORS.enrollments,
            },
          ]}
        />
      </ChartCard>
    </div>
  );
}
