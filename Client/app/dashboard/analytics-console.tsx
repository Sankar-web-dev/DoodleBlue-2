"use client";

import { useQuery } from "@tanstack/react-query";

import { analyticsService, ANALYTICS_SUMMARY_KEY } from "@/api/analytics.api";
import { AnalyticsStatsCards } from "./_components/analytics-stats-cards";
import { AnalyticsCharts } from "./_components/analytics-charts";
import { RecentEnrollmentsCard } from "./_components/recent-enrollments-card";

export function AnalyticsConsole({ isSuper }: { isSuper: boolean }) {
  const { data: summary, isPending, isError } = useQuery({
    queryKey: ANALYTICS_SUMMARY_KEY,
    queryFn: analyticsService.getSummary,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Institution-wide academic metrics and activity overview.
          </p>
        </div>
      </section>

      <AnalyticsStatsCards
        summary={summary}
        isPending={isPending}
        isSuper={isSuper}
      />

      <AnalyticsCharts
        summary={summary}
        isPending={isPending}
        isError={isError}
      />

      <RecentEnrollmentsCard
        summary={summary}
        isPending={isPending}
        isError={isError}
      />
    </div>
  );
}
