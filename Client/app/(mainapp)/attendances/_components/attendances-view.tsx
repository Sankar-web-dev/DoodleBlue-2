"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ClipboardCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
  X,
  Building2,
  Globe,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import type { AttendanceRecord, AttendanceStatus } from "@/api/attendance.api";
import type { EventRegistration } from "@/api/event-registrations.api";
import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../_components/forbidden-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GenericTable from "@/components/ui/generic-table";

import { useEvents } from "../../events/_hooks/use-events";
import { useRegistrations } from "../../event-registration/_hooks/use-registrations";
import {
  useAttendance,
  useMarkAttendance,
  useUpdateAttendance,
} from "../_hooks/use-attendance";
import { AttendanceStatusBadge } from "./attendance-status-badge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** Registrations eligible for attendance — confirmed participants only. */
const CONFIRMED = ["REGISTERED", "APPROVED"];

interface RosterRow {
  registration: EventRegistration;
  record?: AttendanceRecord;
}

export function AttendancesView() {
  const { user, isPending: userPending } = useAuthUser();
  const { can } = usePermissions(user);
  const canMark = can("attendance", "create");
  const canCorrect = can("attendance", "update");
  const canManage = canMark || canCorrect;

  const [eventId, setEventId] = useState("");

  // Published events only — non-managers are additionally scoped to their
  // own clubs by the server.
  const eventsQuery = useEvents({ status: "PUBLISHED" });
  const events = eventsQuery.data?.data ?? [];
  const selectedEvent = events.find((e) => e.id === eventId);

  const regsQuery = useRegistrations(
    { eventId },
    canManage && !!eventId
  );
  // Managers fetch per-event records after picking one; students' own
  // records load immediately (the server scopes them automatically).
  const recordsQuery = useAttendance(
    { eventId },
    canManage ? !!eventId : true
  );

  const recordByStudent = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    for (const r of recordsQuery.data?.data ?? []) {
      map.set(r.studentId, r);
    }
    return map;
  }, [recordsQuery.data]);

  const roster = useMemo<RosterRow[]>(
    () =>
      (regsQuery.data?.data ?? [])
        .filter((r) => CONFIRMED.includes(r.status))
        .map((registration) => ({
          registration,
          record: recordByStudent.get(registration.studentId),
        })),
    [regsQuery.data, recordByStudent]
  );

  const counts = useMemo(
    () => ({
      present: roster.filter((r) => r.record?.status === "PRESENT").length,
      absent: roster.filter((r) => r.record?.status === "ABSENT").length,
      unmarked: roster.filter((r) => !r.record).length,
    }),
    [roster]
  );

  const markMutation = useMarkAttendance();
  const updateMutation = useUpdateAttendance();
  const marking = markMutation.isPending || updateMutation.isPending;

  function mark(row: RosterRow, status: AttendanceStatus) {
    const label =
      status === "PRESENT" ? "present" : "absent";
    const opts = {
      onSuccess: () =>
        toast.success(
          `${row.registration.student?.name ?? "Student"} marked ${label}`
        ),
      onError: (err: Error) =>
        toast.error(err instanceof Error ? err.message : "Marking failed"),
    };
    if (row.record) {
      updateMutation.mutate({ id: row.record.id, status }, opts);
    } else {
      markMutation.mutate(
        {
          eventId,
          studentId: row.registration.studentId,
          status,
        },
        opts
      );
    }
  }

  // ── Roster columns (manager view) ─────────────────────────────────────────

  const rosterColumns = useMemo<ColumnDef<RosterRow, unknown>[]>(
    () => [
      {
        id: "student",
        accessorFn: (r) => r.registration.student?.name ?? "",
        header: "Student",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {row.original.registration.student?.name ?? "Unknown user"}
            </p>
            {row.original.registration.student?.email && (
              <p className="truncate text-xs text-muted-foreground">
                {row.original.registration.student.email}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "attendance",
        header: "Attendance",
        cell: ({ row }) =>
          row.original.record ? (
            <AttendanceStatusBadge status={row.original.record.status} />
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Not marked
            </Badge>
          ),
      },
      {
        id: "markedBy",
        header: "Marked by",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.record?.markedByUser?.name ?? "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const record = row.original.record;
          return (
            <div className="flex items-center justify-end gap-1">
              {(!record ? canMark : canCorrect) && (
                <>
                  <Button
                    size="sm"
                    variant={
                      record?.status === "PRESENT" ? "default" : "ghost"
                    }
                    className={`h-8 text-xs ${
                      record?.status === "PRESENT"
                        ? ""
                        : "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-600"
                    }`}
                    disabled={marking || record?.status === "PRESENT"}
                    onClick={() => mark(row.original, "PRESENT")}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Present
                  </Button>
                  <Button
                    size="sm"
                    variant={
                      record?.status === "ABSENT" ? "destructive" : "ghost"
                    }
                    className={`h-8 text-xs ${
                      record?.status === "ABSENT"
                        ? ""
                        : "text-destructive hover:bg-destructive/10 hover:text-destructive"
                    }`}
                    disabled={marking || record?.status === "ABSENT"}
                    onClick={() => mark(row.original, "ABSENT")}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Absent
                  </Button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canMark, canCorrect, marking, eventId]
  );

  // ── Records columns (student's own attendance history) ────────────────────

  const myRecordsColumns = useMemo<ColumnDef<AttendanceRecord, unknown>[]>(
    () => [
      {
        id: "event",
        accessorFn: (r) => r.event?.title ?? "",
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
          <AttendanceStatusBadge status={row.original.status} />
        ),
      },
      {
        accessorKey: "markedAt",
        header: "Marked at",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.markedAt)}
          </span>
        ),
      },
    ],
    []
  );

  if (userPending) return null;
  if (!can("attendance", "read")) {
    return (
      <ForbiddenState message="You don't have permission to view attendance." />
    );
  }

  // Disabled queries report isPending — only count them once an event is
  // picked (managers) since students' records query is always enabled.
  const isPending = canManage
    ? eventsQuery.isPending ||
      (!!eventId && (regsQuery.isPending || recordsQuery.isPending))
    : recordsQuery.isPending;
  const error = canManage
    ? eventsQuery.error ??
      (eventId ? regsQuery.error ?? recordsQuery.error : null)
    : recordsQuery.error;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManage
            ? "Pick an event and mark confirmed participants present or absent."
            : "Your attendance record for past events."}
        </p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading attendance…
        </div>
      )}

      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load attendance."}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                eventsQuery.refetch();
                regsQuery.refetch();
                recordsQuery.refetch();
              }}
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {!isPending && !error && canManage && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">Mark attendance</h2>
            </div>
            <Select value={eventId} onValueChange={setEventId}>
              <SelectTrigger className="h-10 w-full sm:w-80 rounded-xl">
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                    {event.eventType === "CLUB" ? " — Club" : " — General"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {eventId && (
            <>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-emerald-600">
                    {counts.present}
                  </span>{" "}
                  present
                </span>
                <span>
                  <span className="font-medium text-destructive">
                    {counts.absent}
                  </span>{" "}
                  absent
                </span>
                <span>
                  <span className="font-medium">{counts.unmarked}</span>{" "}
                  unmarked
                </span>
                {selectedEvent && (
                  <span className="ml-auto text-xs">
                    {selectedEvent.title} · {formatDate(selectedEvent.startAt)}
                  </span>
                )}
              </div>
              <GenericTable
                columns={rosterColumns}
                data={roster}
                sort
                filter
                filterColumn="student"
                filterPlaceHolder="Search students…"
                pagination
              />
            </>
          )}
        </section>
      )}

      {!isPending && !error && !canManage && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">My attendance</h2>
          </div>
          <GenericTable
            columns={myRecordsColumns}
            data={recordsQuery.data?.data ?? []}
            sort
            filter
            filterColumn="event"
            filterPlaceHolder="Search events…"
            filterWithSelect
            filterWithSelectFieldNames={["status"]}
            filterWithSelectFieldOptions={[
              [
                { label: "Present", value: "PRESENT" },
                { label: "Absent", value: "ABSENT" },
              ],
            ]}
            pagination
          />
        </section>
      )}
    </div>
  );
}
