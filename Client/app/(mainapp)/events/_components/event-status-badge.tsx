import type { EventStatus } from "@/api/events.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<EventStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border/40",
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  PUBLISHED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  CANCELLED: "bg-muted text-muted-foreground border-border/40 line-through",
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
