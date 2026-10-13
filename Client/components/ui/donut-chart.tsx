import { cn } from "@/lib/utils";

export interface DonutSlice {
  label: string;
  value: number;
  /** Any CSS colour — hex, hsl(), tailwind arbitrary value, etc. */
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  size?: number;
  strokeWidth?: number;
  /** Text rendered in the centre of the ring. */
  centerLabel?: string;
  className?: string;
}

/**
 * Lightweight SVG donut chart — no chart library needed.
 * Renders an empty grey ring when every slice is zero.
 */
export function DonutChart({
  slices,
  size = 180,
  strokeWidth = 24,
  centerLabel,
  className,
}: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-6 sm:flex-row",
        className
      )}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(", ")}
      >
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {/* Track ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-muted/40"
          />
          {total > 0 &&
            slices.map((slice) => {
              const fraction = slice.value / total;
              const dash = fraction * circumference;
              const circle = (
                <circle
                  key={slice.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return circle;
            })}
        </g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-foreground text-2xl font-bold"
        >
          {total}
        </text>
        {centerLabel && (
          <text
            x="50%"
            y="62%"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground text-xs"
          >
            {centerLabel}
          </text>
        )}
      </svg>

      <ul className="w-full min-w-[10rem] space-y-2 text-sm sm:w-auto">
        {slices.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="ml-auto pl-4 font-semibold tabular-nums">
              {s.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
