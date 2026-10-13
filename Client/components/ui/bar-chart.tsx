"use client";

import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

export function BarChart({
  bars,
  ariaLabel,
  className,
}: {
  bars: BarDatum[];
  ariaLabel?: string;
  className?: string;
}) {
  const max = Math.max(...bars.map((b) => b.value), 0);

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("w-full", className)}
    >
      <div className="flex h-[160px] items-end gap-6">
        {bars.map((bar) => {
          const pct = max > 0 ? (bar.value / max) * 100 : 0;
          return (
            <div
              key={bar.label}
              className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2 self-stretch"
            >
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {bar.value.toLocaleString()}
              </span>
              <div
                className="w-full max-w-[96px] rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: bar.color,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-6 border-t border-border/60 pt-2">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className="flex min-w-0 flex-1 items-center justify-center gap-1.5"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: bar.color }}
            />
            <span className="truncate text-center text-xs text-muted-foreground">
              {bar.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
