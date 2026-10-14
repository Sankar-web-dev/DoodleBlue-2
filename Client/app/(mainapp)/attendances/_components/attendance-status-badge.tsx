import type { AttendanceStatus } from "@/api/attendance.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  ABSENT: "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
};

export function AttendanceStatusBadge({
  status,
}: {
  status: AttendanceStatus;
}) {
  return (
    <Badge className={`${STATUS_STYLES[status]} text-xs`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
