"use client";

import {
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  UserCog,
} from "lucide-react";

import { AnalyticsSummary } from "@/api/analytics.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function ResourceCard({
  icon: Icon,
  label,
  counts,
  breakdown,
  isPending,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  counts?: { total: number; active: number };
  breakdown?: string;
  isPending: boolean;
}) {
  const value = isPending ? "–" : (counts?.total ?? 0).toLocaleString();
  const subtitle = isPending
    ? "Loading…"
    : breakdown ??
      `${(counts?.active ?? 0).toLocaleString()} active · ${(
        (counts?.total ?? 0) - (counts?.active ?? 0)
      ).toLocaleString()} inactive`;

  return (
    <Card className="min-w-0 border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
        <CardTitle className="truncate text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="shrink-0 rounded-lg border border-border/60 bg-muted p-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="truncate text-3xl font-bold tracking-tight text-foreground">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function AnalyticsStatsCards({
  summary,
  isPending,
  isSuper,
}: {
  summary?: AnalyticsSummary;
  isPending: boolean;
  isSuper: boolean;
}) {
  const cards = [
    {
      icon: GraduationCap,
      label: "Students",
      counts: summary?.students,
    },
    {
      icon: Building2,
      label: "Departments",
      counts: summary?.departments,
    },
    {
      icon: BookOpen,
      label: "Courses",
      counts: summary?.courses,
    },
    {
      icon: ClipboardList,
      label: "Enrollments",
      counts: summary?.enrollments,
      breakdown: summary
        ? `${summary.enrollments.active} active · ${summary.enrollments.completed} completed · ${summary.enrollments.withdrawn} withdrawn`
        : undefined,
    },
    ...(isSuper
      ? [
          {
            icon: UserCog,
            label: "Admins",
            counts: summary?.admins,
          },
        ]
      : []),
  ];

  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-fr">
        {cards.map((card) => (
          <ResourceCard key={card.label} {...card} isPending={isPending} />
        ))}
      </div>
    </section>
  );
}
