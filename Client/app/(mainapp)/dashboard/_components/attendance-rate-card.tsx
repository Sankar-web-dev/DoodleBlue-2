import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AttendanceRateCardProps {
  present: number;
  absent: number;
}

export function AttendanceRateCard({ present, absent }: AttendanceRateCardProps) {
  const total = present + absent;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  // r = 52 → circumference ≈ 326.7
  const R = 52;
  const CIRC = 2 * Math.PI * R;

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Attendance rate</CardTitle>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            This week
          </span>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="11"
              className="stroke-muted"
            />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="11"
              strokeLinecap="round"
              strokeDasharray={`${(rate / 100) * CIRC} ${CIRC}`}
              className="stroke-emerald-500 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold leading-none tabular-nums">
              {rate}%
            </span>
            <span className="text-[10px] text-muted-foreground">present</span>
          </div>
        </div>
        <div className="space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Present</span>
            <span className="font-semibold tabular-nums">{present}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Absent</span>
            <span className="font-semibold tabular-nums">{absent}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
            <span className="text-muted-foreground">Total</span>
            <span className="font-semibold tabular-nums">
              {total.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
