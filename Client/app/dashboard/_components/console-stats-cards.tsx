"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ConsoleStatsCards({
  stats,
  isPending,
}: {
  stats: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number;
  }[];
  isPending: boolean;
}) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-none md:grid-flow-col md:auto-cols-fr">
        {stats.map(({ icon: Icon, label, value }) => (
          <Card
            key={label}
            className="min-w-0 border-border/70 bg-card/95 shadow-sm"
          >
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <CardTitle className="truncate text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <span className="shrink-0 rounded-lg border border-border/60 bg-muted p-2 text-muted-foreground">
                <Icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="truncate text-3xl font-bold tracking-tight text-foreground">
                {isPending ? "–" : value.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
