import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ROLE_COLORS = [
  "#8b5cf6", // primary-ish violet
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#f43f5e", // rose
  "#64748b", // slate
];

interface UsersByRoleCardProps {
  usersByRole: { role: string; count: number }[];
}

export function UsersByRoleCard({ usersByRole }: UsersByRoleCardProps) {
  const total = usersByRole.reduce((s, r) => s + r.count, 0);
  const R = 40;
  const CIRC = 2 * Math.PI * R;

  let offset = 0;
  const segments = usersByRole.map((r, i) => {
    const frac = total > 0 ? r.count / total : 0;
    const seg = {
      ...r,
      color: ROLE_COLORS[i % ROLE_COLORS.length],
      dash: `${frac * CIRC} ${CIRC}`,
      dashoffset: -offset * CIRC,
    };
    offset += frac;
    return seg;
  });

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Users by role</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
            {total === 0 && (
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="12"
                className="stroke-muted"
              />
            )}
            {segments.map((s) => (
              <circle
                key={s.role}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                strokeWidth="12"
                stroke={s.color}
                strokeDasharray={s.dash}
                strokeDashoffset={s.dashoffset}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold leading-none tabular-nums">
              {total}
            </span>
            <span className="text-[10px] text-muted-foreground">Users</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          {segments.length === 0 && (
            <p className="text-xs text-muted-foreground">No users yet.</p>
          )}
          {segments.map((s) => (
            <div key={s.role} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate text-muted-foreground">{s.role}</span>
              <span className="ml-auto font-semibold tabular-nums">
                {s.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
