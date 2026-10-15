import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface PipelineStage {
  label: string;
  value: number;
  color: string;
}

interface PipelineCardProps {
  title: string;
  stages: PipelineStage[];
}

/** Funnel: each stage's bar width is relative to the first stage. */
export function PipelineCard({ title, stages }: PipelineCardProps) {
  const base = Math.max(1, stages[0]?.value ?? 0);

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage) => {
          const pct = Math.max((stage.value / base) * 100, stage.value > 0 ? 4 : 0);
          return (
            <div key={stage.label} className="space-y-1">
              <div className="flex items-baseline justify-between text-xs">
                <span className="font-medium">{stage.label}</span>
                <span className="text-muted-foreground tabular-nums">
                  {stage.value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${stage.color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
