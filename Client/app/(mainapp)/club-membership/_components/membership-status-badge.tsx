import type { MembershipStatus } from "@/api/club-memberships.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<MembershipStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  INACTIVE: "bg-muted text-muted-foreground border-border/40",
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
