import type { CertificateStatus } from "@/api/certificates.api";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<CertificateStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  APPROVED: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  REJECTED: "bg-destructive/10 text-destructive border-destructive/20",
  ISSUED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const STATUS_LABELS: Record<CertificateStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ISSUED: "Issued",
};

export function CertificateStatusBadge({
  status,
}: {
  status: CertificateStatus;
}) {
  return (
    <Badge className={`${STATUS_STYLES[status]} text-xs`}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
