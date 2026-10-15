import type { EventStatus } from "@/api/events.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border/60",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  APPROVED: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  PUBLISHED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  CANCELLED: "bg-muted text-muted-foreground border-border/60 line-through opacity-75",
};

const STATUS_LABELS: Record<EventStatus, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge className={`${STATUS_STYLES[status]} text-xs`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
