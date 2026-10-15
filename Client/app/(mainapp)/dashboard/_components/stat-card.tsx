import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  href?: string;
  /** New records in the last 7 days — renders "+N this week". */
  delta?: number;
  /** Tailwind classes for the icon chip, e.g. "bg-primary/10 text-primary". */
  accent?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  delta,
  accent,
}: StatCardProps) {
  const body = (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/10">
      <CardContent className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${
            accent ?? "bg-primary/10 text-primary"
          }`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-xl font-bold tracking-tight leading-none sm:text-2xl">
            {value.toLocaleString()}
          </p>
          <p className="mt-1 truncate text-xs font-medium text-muted-foreground">
            {label}
          </p>
          {delta !== undefined && delta > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" />+{delta} this week
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}
