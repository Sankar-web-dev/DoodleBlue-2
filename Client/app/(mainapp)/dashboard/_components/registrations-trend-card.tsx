import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RegistrationsTrendCardProps {
  trend: { date: string; label: string; count: number }[];
}

const W = 300;
const H = 90;
const PAD = 8;

export function RegistrationsTrendCard({ trend }: RegistrationsTrendCardProps) {
  const total = trend.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...trend.map((d) => d.count));

  const pts = trend.map((d, i) => {
    const x = PAD + (i / Math.max(trend.length - 1, 1)) * (W - PAD * 2);
    const y = H - PAD - (d.count / max) * (H - PAD * 2);
    return { x, y, ...d };
  });

  const line = pts.map((p) => `${p.x},${p.y}`).join(" ");
  const area = `${PAD},${H - PAD} ${line} ${W - PAD},${H - PAD}`;

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            Registrations trend
          </CardTitle>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            Last 7 days · {total.toLocaleString()}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-28 w-full"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className="[stop-color:var(--primary)]" stopOpacity="0.25" />
              <stop offset="100%" className="[stop-color:var(--primary)]" stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#trendFill)" />
          <polyline
            points={line}
            fill="none"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-primary"
          />
          {pts.map((p) => (
            <circle
              key={p.date}
              cx={p.x}
              cy={p.y}
              r="3"
              className="fill-card stroke-primary"
              strokeWidth="2"
            >
              <title>{`${p.date}: ${p.count}`}</title>
            </circle>
          ))}
        </svg>
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          {trend.map((d) => (
            <span key={d.date}>{d.label}</span>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
