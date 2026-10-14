import type { RegistrationStatus } from "@/api/event-registrations.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<RegistrationStatus, string> = {
  REGISTERED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  CANCELLED: "bg-muted text-muted-foreground border-border/40 line-through",
};

const STATUS_LABELS: Record<RegistrationStatus, string> = {
  REGISTERED: "Registered",
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export function RegistrationStatusBadge({
  status,
}: {
  status: RegistrationStatus;
}) {
  return (
    <Badge className={`${STATUS_STYLES[status]} text-xs`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
