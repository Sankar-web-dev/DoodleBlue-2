"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  ClipboardList,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  Globe,
  Trash2,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { EventItem } from "@/api/events.api";
import type { EventRegistration } from "@/api/event-registrations.api";
import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericTable from "@/components/ui/generic-table";

import { useEvents } from "../../events/_hooks/use-events";
import {
  useRegistrations,
  useRegisterForEvent,
  useReviewRegistration,
  useCancelRegistration,
  useDeleteRegistration,
} from "../_hooks/use-registrations";
import { RegistrationStatusBadge } from "./registration-status-badge";
import { RejectRegistrationDialog } from "./reject-registration-dialog";
import { RegistrationCelebration } from "./registration-celebration";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function isClosed(event: EventItem) {
  return (
    !!event.registrationDeadline &&
    new Date() > new Date(event.registrationDeadline)
  );
}

export function RegistrationsView() {
  const { user, isPending: userPending } = useAuthUser();
  const { can } = usePermissions(user);
  const canRegister = can("eventRegistrations", "create");
  const canReview = can("eventRegistrations", "update");
  const canDelete = can("eventRegistrations", "delete");

  const [rejectReg, setRejectReg] = useState<EventRegistration | null>(null);
  const [celebrate, setCelebrate] = useState<{
    title: string;
    venue?: string;
    pending: boolean;
  } | null>(null);

  // PUBLISHED only — the server additionally scopes club events to the
  // student's active memberships for non-managers.
  const eventsQuery = useEvents({ status: "PUBLISHED" });
  const openEvents = useMemo(
    () => (eventsQuery.data?.data ?? []).filter((e) => e.status === "PUBLISHED"),
    [eventsQuery.data]
  );

  const regsQuery = useRegistrations();
  const registrations = useMemo(
    () => regsQuery.data?.data ?? [],
    [regsQuery.data]
  );

  // The student's own registration per event — drives the register/status
  // button in the browse table.
  const myRegByEvent = useMemo(() => {
    const map = new Map<string, EventRegistration>();
    for (const r of registrations) {
      if (r.studentId === user?.id) map.set(r.eventId, r);
    }
    return map;
  }, [registrations, user?.id]);

  const registerMutation = useRegisterForEvent();
  const reviewMutation = useReviewRegistration();
  const cancelMutation = useCancelRegistration();
  const deleteMutation = useDeleteRegistration();

  function handleRegister(event: EventItem) {
    registerMutation.mutate(event.id, {
      onSuccess: (res) =>
        setCelebrate({
          title: event.title,
          venue: event.venue,
          pending: res.registration.status === "PENDING",
        }),
      onError: (err) =>
        toast.error(
          err instanceof Error ? err.message : "Registration failed"
        ),
    });
  }

  function handleApprove(reg: EventRegistration) {
    reviewMutation.mutate(
      { id: reg.id, status: "APPROVED" },
      {
        onSuccess: () =>
          toast.success(
            `${reg.student?.name ?? "Student"} approved for "${
              reg.event?.title ?? "event"
            }"`
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Approve failed"),
      }
    );
  }

  function handleCancel(reg: EventRegistration) {
    cancelMutation.mutate(reg.id, {
      onSuccess: () => toast.success("Registration cancelled"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Cancel failed"),
    });
  }

  function handleDelete(reg: EventRegistration) {
    deleteMutation.mutate(reg.id, {
      onSuccess: () => toast.success("Registration deleted"),
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Delete failed"),
    });
  }

  // ── Browse table: published events the student can join ──────────────────

  const eventColumns = useMemo<ColumnDef<EventItem, unknown>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Event",
        cell: ({ row }) => (
          <div className="flex items-center gap-3 py-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {row.original.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {row.original.venue}
              </p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "eventType",
        header: "Type",
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {row.original.eventType === "CLUB" ? (
              <Building2 className="h-3 w-3 mr-1" />
            ) : (
              <Globe className="h-3 w-3 mr-1" />
            )}
            {row.original.eventType === "CLUB" ? "Club" : "General"}
          </Badge>
        ),
      },
      {
        accessorKey: "startAt",
        header: "Starts",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.startAt)}
          </span>
        ),
      },
      {
        accessorKey: "registrationDeadline",
        header: "Deadline",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.registrationDeadline
              ? formatDate(row.original.registrationDeadline)
              : "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const event = row.original;
          const existing = myRegByEvent.get(event.id);
          if (existing) {
            return (
              <div className="flex justify-end">
                <RegistrationStatusBadge status={existing.status} />
              </div>
            );
          }
          const closed = isClosed(event);
          const registering =
            registerMutation.isPending &&
            registerMutation.variables === event.id;
          return (
            <div className="flex justify-end">
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={closed || registerMutation.isPending}
                onClick={() => handleRegister(event)}
              >
                {registering ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Register"
                )}
              </Button>
              {closed && (
                <span className="ml-2 self-center text-xs text-muted-foreground">
                  Closed
                </span>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [myRegByEvent, registerMutation.isPending, registerMutation.variables]
  );

  // ── Registrations table ──────────────────────────────────────────────────

  const regColumns = useMemo<ColumnDef<EventRegistration, unknown>[]>(() => {
    const cols: ColumnDef<EventRegistration, unknown>[] = [];

    if (canReview) {
      cols.push({
        id: "student",
        accessorFn: (r) => r.student?.name ?? r.studentId,
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.student?.name ?? "Unknown user"}
            </p>
            {row.original.student?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.student.email}
              </p>
            )}
          </div>
        ),
      });
    }

    cols.push(
      {
        id: "event",
        accessorFn: (r) => r.event?.title ?? r.eventId,
        header: "Event",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.event?.title ?? "Unknown event"}
            </p>
            {row.original.event?.startAt && (
              <p className="truncate text-xs text-muted-foreground">
                {formatDate(row.original.event.startAt)} ·{" "}
                {row.original.event.venue}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.event?.eventType === "CLUB" ? (
            <Badge variant="secondary" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" />
              Club
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <Globe className="h-3 w-3 mr-1" />
              General
            </Badge>
          ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <RegistrationStatusBadge status={row.original.status} />
            {row.original.status === "REJECTED" &&
              row.original.rejectionReason && (
                <span className="text-xs text-muted-foreground">
                  {row.original.rejectionReason}
                </span>
              )}
          </div>
        ),
      },
      {
        accessorKey: "registeredAt",
        header: "Registered",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {new Date(row.original.registeredAt).toLocaleDateString()}
          </span>
        ),
      }
    );

    if (canReview) {
      cols.push({
        id: "reviewedBy",
        header: "Reviewed by",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.reviewedByUser?.name ?? "—"}
          </span>
        ),
      });
    }

    cols.push({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const reg = row.original;
        const isOwn = reg.studentId === user?.id;
        const cancellable = ["REGISTERED", "PENDING", "APPROVED"].includes(
          reg.status
        );
        return (
          <div className="flex items-center justify-end gap-1">
            {canReview && reg.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                  disabled={
                    reviewMutation.isPending &&
                    reviewMutation.variables?.id === reg.id
                  }
                  onClick={() => handleApprove(reg)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setRejectReg(reg)}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {isOwn && cancellable && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                disabled={
                  cancelMutation.isPending &&
                  cancelMutation.variables === reg.id
                }
                onClick={() => handleCancel(reg)}
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            )}
            {canDelete && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={
                  deleteMutation.isPending &&
                  deleteMutation.variables === reg.id
                }
                onClick={() => handleDelete(reg)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        );
      },
    });

    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReview, canDelete, user?.id, reviewMutation.isPending, reviewMutation.variables, cancelMutation.isPending, cancelMutation.variables, deleteMutation.isPending, deleteMutation.variables]);

  if (userPending) return null;
  if (!can("eventRegistrations", "read")) {
    return (
      <ForbiddenState message="You don't have permission to view event registrations." />
    );
  }

  const isPending = regsQuery.isPending || (canRegister && eventsQuery.isPending);
  // The browse section degrades gracefully — a student may be able to
  // register without events:read, and their registrations still show.
  const browseFailed = canRegister && !!eventsQuery.error;
  const error = regsQuery.error ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Event Registrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canReview
            ? "Review sign-ups for your club events and manage registrations."
            : "Browse open events and track your registrations."}
        </p>
      </div>

      {/* Loading */}
      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading registrations…
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load registrations."}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                regsQuery.refetch();
                eventsQuery.refetch();
              }}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Open events — only for users who can register and read events */}
      {!isPending && !error && canRegister && !browseFailed && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Open for registration</h2>
          </div>
          <GenericTable
            columns={eventColumns}
            data={openEvents}
            sort
            filter
            filterColumn="title"
            filterPlaceHolder="Search events…"
            filterWithSelect
            filterWithSelectFieldNames={["eventType"]}
            filterWithSelectFieldOptions={[
              [
                { label: "General", value: "GENERAL" },
                { label: "Club", value: "CLUB" },
              ],
            ]}
            pagination
          />
        </section>
      )}

      {/* Registrations — own for students, review queue for coordinators */}
      {!isPending && !error && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">
              {canReview ? "Registrations" : "My registrations"}
            </h2>
          </div>
          <GenericTable
            columns={regColumns}
            data={registrations}
            sort
            filter
            filterColumn={canReview ? "student" : "event"}
            filterPlaceHolder={
              canReview ? "Search students…" : "Search events…"
            }
            filterWithSelect
            filterWithSelectFieldNames={["status"]}
            filterWithSelectFieldOptions={[
              [
                { label: "Registered", value: "REGISTERED" },
                { label: "Pending review", value: "PENDING" },
                { label: "Approved", value: "APPROVED" },
                { label: "Rejected", value: "REJECTED" },
                { label: "Cancelled", value: "CANCELLED" },
              ],
            ]}
            pagination
          />
        </section>
      )}

      {/* Reject dialog — requires a reason */}
      <RejectRegistrationDialog
        registration={rejectReg}
        onClose={() => setRejectReg(null)}
      />

      {/* Full-screen success celebration */}
      {celebrate && (
        <RegistrationCelebration
          eventTitle={celebrate.title}
          venue={celebrate.venue}
          pending={celebrate.pending}
          onClose={() => setCelebrate(null)}
        />
      )}
    </div>
  );
}
