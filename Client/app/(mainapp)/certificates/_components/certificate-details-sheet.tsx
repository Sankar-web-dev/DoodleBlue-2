"use client";

import { Award, ExternalLink } from "lucide-react";

import type { CertificateItem } from "@/api/certificates.api";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { CertificateStatusBadge } from "./certificate-status-badge";

interface CertificateDetailsSheetProps {
  certificate: CertificateItem | null;
  eventTitle?: string;
  studentName?: string;
  onClose: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function CertificateDetailsSheet({
  certificate,
  eventTitle,
  studentName,
  onClose,
}: CertificateDetailsSheetProps) {
  return (
    <Sheet open={!!certificate} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {certificate && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle>
                    {certificate.certificateNumber ?? "Certificate request"}
                  </SheetTitle>
                  <SheetDescription>
                    {eventTitle ?? `Event …${certificate.eventId.slice(-6)}`}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <CertificateStatusBadge status={certificate.status} />
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Student</dt>
                <dd className="text-right">
                  {studentName ?? `…${certificate.studentId.slice(-6)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Event</dt>
                <dd className="text-right">
                  {eventTitle ?? `…${certificate.eventId.slice(-6)}`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Requested</dt>
                <dd>{formatDate(certificate.createdAt)}</dd>
              </div>
              {certificate.approvedAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Approved at</dt>
                  <dd>{formatDate(certificate.approvedAt)}</dd>
                </div>
              )}
              {certificate.issuedAt && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Issued at</dt>
                  <dd>{formatDate(certificate.issuedAt)}</dd>
                </div>
              )}
              {certificate.certificateNumber && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Certificate number
                  </dt>
                  <dd className="font-mono text-xs">
                    {certificate.certificateNumber}
                  </dd>
                </div>
              )}
            </dl>

            {certificate.certificateUrl && (
              <>
                <Separator className="my-5" />
                <Button asChild variant="outline" className="w-full">
                  <a
                    href={certificate.certificateUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open certificate
                  </a>
                </Button>
              </>
            )}

            {certificate.status === "REJECTED" &&
              certificate.rejectionReason && (
                <>
                  <Separator className="my-5" />
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                    <p className="text-xs font-semibold text-destructive">
                      Rejection reason
                    </p>
                    <p className="mt-1 text-sm text-destructive/90">
                      {certificate.rejectionReason}
                    </p>
                  </div>
                </>
              )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
