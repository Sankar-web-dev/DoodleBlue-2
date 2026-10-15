import type { MembershipStatus } from "@/api/club-memberships.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<MembershipStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  ACTIVE: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  INACTIVE: "bg-muted text-muted-foreground border-border/60",
};

const STATUS_LABELS: Record<MembershipStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

export function MembershipStatusBadge({
  status,
}: {
  status: MembershipStatus;
}) {
  return (
    <Badge className={`${STATUS_STYLES[status]} text-xs`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
