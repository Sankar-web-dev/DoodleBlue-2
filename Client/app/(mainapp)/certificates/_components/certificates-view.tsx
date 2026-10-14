"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Award,
  AlertCircle,
  RefreshCw,
  Eye,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  XCircle,
  BadgeCheck,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { authService, AUTH_ME_KEY } from "@/api/auth.api";
import { eventsApi } from "@/api/events.api";
import { usersApi } from "@/api/users.api";
import type {
  CertificateItem,
  CertificateStatus,
} from "@/api/certificates.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GenericTable from "@/components/ui/generic-table";

import {
  useCertificates,
  useCertificateDecision,
} from "../_hooks/use-certificates";
import { CertificateStatusBadge } from "./certificate-status-badge";
import { CertificatesSkeleton } from "./certificates-skeleton";
import { CertificateDetailsSheet } from "./certificate-details-sheet";
import { RejectCertificateDialog } from "./reject-certificate-dialog";
import { IssueCertificateDialog } from "./issue-certificate-dialog";
import { DeleteCertificateDialog } from "./delete-certificate-dialog";

const STATUS_FILTER_OPTIONS: { label: string; value: CertificateStatus }[] = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Issued", value: "ISSUED" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

function shortId(id: string) {
  return `…${id.slice(-6)}`;
}

export function CertificatesView() {
  const [viewCert, setViewCert] = useState<CertificateItem | null>(null);
  const [deleteCert, setDeleteCert] = useState<CertificateItem | null>(null);
  const [rejectCert, setRejectCert] = useState<CertificateItem | null>(null);
  const [issueCert, setIssueCert] = useState<CertificateItem | null>(null);

  const { data: me } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authService.me,
  });
  const { can } = usePermissions(me?.user ?? null);
  const canCreate = can("certificates", "create");
  const canUpdate = can("certificates", "update");
  const canDelete = can("certificates", "delete");

  const { data, isPending, error, refetch } = useCertificates();
  const certificates = data?.data ?? [];

  // Lookup maps for friendlier cells — tolerate missing read access.
  const { data: eventsData } = useQuery({
    queryKey: ["events", "options"],
    queryFn: () => eventsApi.listEvents({ limit: 100 }),
    retry: false,
  });
  const { data: usersData } = useQuery({
    queryKey: ["users", "options"],
    queryFn: () => usersApi.listUsers({ limit: 100 }),
    retry: false,
  });

  const eventTitles = useMemo(
    () =>
      new Map((eventsData?.data ?? []).map((e) => [e.id, e.title] as const)),
    [eventsData]
  );
  const studentNames = useMemo(
    () =>
      new Map(
        (usersData?.data ?? []).map(
          (u) => [u.id, `${u.name} (${u.email})`] as const
        )
      ),
    [usersData]
  );

  const decision = useCertificateDecision();

  const columns = useMemo<ColumnDef<CertificateItem, unknown>[]>(
    () => [
      {
        accessorKey: "certificateNumber",
        header: "Certificate",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.certificateNumber ?? "Not issued yet"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {eventTitles.get(row.original.eventId) ??
                  `Event ${shortId(row.original.eventId)}`}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "studentId",
        header: "Student",
        cell: ({ row }) => (
          <span className="text-sm">
            {studentNames.get(row.original.studentId) ??
              shortId(row.original.studentId)}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <CertificateStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Requested",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const cert = row.original;
          const reviewable = cert.status === "PENDING";
          const issuable = cert.status === "APPROVED";

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setViewCert(cert)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View details
              </Button>
              {canUpdate && (reviewable || issuable) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Workflow actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {reviewable && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            decision.mutate(
                              { id: cert.id, action: "approve" },
                              {
                                onSuccess: () =>
                                  toast.success("Certificate approved"),
                                onError: (err) =>
                                  toast.error(
                                    err instanceof Error
                                      ? err.message
                                      : "Approve failed"
                                  ),
                              }
                            )
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRejectCert(cert)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {issuable && (
                      <DropdownMenuItem onClick={() => setIssueCert(cert)}>
                        <BadgeCheck className="mr-2 h-4 w-4" />
                        Issue certificate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteCert(cert)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUpdate, canDelete, eventTitles, studentNames]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Request participation certificates for eligible students, then
            approve and issue them.
          </p>
        </div>
        {canCreate && (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/certificates/create">
              <Plus className="mr-1.5 h-4 w-4" />
              Create certificate
            </Link>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isPending && <CertificatesSkeleton />}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load certificates."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Certificates table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={certificates}
          sort
          filter
          filterColumn="certificateNumber"
          filterPlaceHolder="Search certificate no…"
          filterWithSelect
          filterWithSelectFieldNames={["status"]}
          filterWithSelectFieldOptions={[STATUS_FILTER_OPTIONS]}
          pagination
        />
      )}

      {/* View details sheet */}
      <CertificateDetailsSheet
        certificate={viewCert}
        eventTitle={viewCert ? eventTitles.get(viewCert.eventId) : undefined}
        studentName={
          viewCert ? studentNames.get(viewCert.studentId) : undefined
        }
        onClose={() => setViewCert(null)}
      />

      {/* Reject dialog */}
      <RejectCertificateDialog
        certificate={rejectCert}
        onClose={() => setRejectCert(null)}
      />

      {/* Issue dialog */}
      <IssueCertificateDialog
        certificate={issueCert}
        onClose={() => setIssueCert(null)}
      />

      {/* Delete confirm dialog */}
      <DeleteCertificateDialog
        certificate={deleteCert}
        onClose={() => setDeleteCert(null)}
      />
    </div>
  );
}
