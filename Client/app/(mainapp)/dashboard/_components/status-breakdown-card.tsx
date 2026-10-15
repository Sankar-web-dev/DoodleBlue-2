import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface BreakdownSlice {
  label: string;
  value: number;
  /** Tailwind bg class for the bar segment, e.g. "bg-emerald-500". */
  color: string;
}

interface StatusBreakdownCardProps {
  title: string;
  slices: BreakdownSlice[];
}

export function StatusBreakdownCard({ title, slices }: StatusBreakdownCardProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className="text-xs text-muted-foreground">
            {total.toLocaleString()} total
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
          {slices.map(
            (s) =>
              s.value > 0 && (
                <div
                  key={s.label}
                  className={`${s.color} h-full transition-all`}
                  style={{ width: `${(s.value / total) * 100}%` }}
                  title={`${s.label}: ${s.value}`}
                />
              )
          )}
        </div>
        {/* Legend — vertical list keeps every count perfectly aligned */}
        <div className="divide-y divide-border/40">
          {slices.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 py-1.5 text-xs">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.color}`} />
              <span className="truncate text-muted-foreground">{s.label}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {s.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
