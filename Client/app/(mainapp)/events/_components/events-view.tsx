"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  Send,
  CheckCircle2,
  XCircle,
  Megaphone,
  Ban,
  Building2,
  Globe,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { authService, AUTH_ME_KEY } from "@/api/auth.api";
import type { EventItem, EventStatus } from "@/api/events.api";
import { usePermissions } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GenericTable from "@/components/ui/generic-table";

import { useEvents, useEventTransition } from "../_hooks/use-events";
import { EventStatusBadge } from "./event-status-badge";
import { EventsSkeleton } from "./events-skeleton";
import { EventDetailsSheet } from "./event-details-sheet";
import { DeleteEventDialog } from "./delete-event-dialog";
import { RejectEventDialog } from "./reject-event-dialog";

const TYPE_LABELS: Record<EventItem["eventType"], string> = {
  GENERAL: "General",
  CLUB: "Club",
};

const STATUS_FILTER_OPTIONS: { label: string; value: EventStatus }[] = [
  { label: "Draft", value: "DRAFT" },
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Cancelled", value: "CANCELLED" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EventsView() {
  const router = useRouter();
  const [viewEvent, setViewEvent] = useState<EventItem | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<EventItem | null>(null);
  const [rejectEvent, setRejectEvent] = useState<EventItem | null>(null);

  const { data: me } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authService.me,
  });
  const { can } = usePermissions(me?.user ?? null);
  const canCreate = can("events", "create");
  const canUpdate = can("events", "update");
  const canDelete = can("events", "delete");
  // Approve / reject / publish are SUPER_ADMIN decisions on the server.
  const isSuperAdmin = me?.user?.role === "SUPER_ADMIN";

  const { data, isPending, error, refetch } = useEvents();
  const events = data?.data ?? [];

  const transition = useEventTransition();

  function runTransition(
    event: EventItem,
    action: "submit" | "approve" | "publish" | "cancel",
    label: string
  ) {
    transition.mutate(
      { id: event.id, action },
      {
        onSuccess: () => toast.success(`"${event.title}" ${label}`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Action failed"),
      }
    );
  }

  const columns = useMemo<ColumnDef<EventItem, unknown>[]>(
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
            {TYPE_LABELS[row.original.eventType]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <EventStatusBadge status={row.original.status} />,
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
        id: "actions",
        header: () => <span className="sr-only">Actions</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const event = row.original;
          const editable = !["PUBLISHED", "CANCELLED"].includes(event.status);
          const submittable = ["DRAFT", "REJECTED"].includes(event.status);
          const reviewable = event.status === "PENDING" && isSuperAdmin;
          const publishable = event.status === "APPROVED" && isSuperAdmin;
          const cancellable = [
            "DRAFT",
            "PENDING",
            "APPROVED",
            "PUBLISHED",
          ].includes(event.status);
          const deletable = ["DRAFT", "REJECTED", "CANCELLED"].includes(
            event.status
          );
          const hasTransitions =
            submittable || reviewable || publishable || cancellable;

          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => setViewEvent(event)}
              >
                <Eye className="h-3.5 w-3.5 mr-1.5" />
                View details
              </Button>
              {canUpdate && editable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs"
                  onClick={() => router.push(`/events/${event.id}/edit`)}
                >
                  <Pencil className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              )}
              {canUpdate && hasTransitions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Workflow actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {submittable && (
                      <DropdownMenuItem
                        onClick={() =>
                          runTransition(event, "submit", "submitted for review")
                        }
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Submit for review
                      </DropdownMenuItem>
                    )}
                    {reviewable && (
                      <>
                        <DropdownMenuItem
                          onClick={() =>
                            runTransition(event, "approve", "approved")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setRejectEvent(event)}>
                          <XCircle className="mr-2 h-4 w-4" />
                          Reject
                        </DropdownMenuItem>
                      </>
                    )}
                    {publishable && (
                      <DropdownMenuItem
                        onClick={() =>
                          runTransition(event, "publish", "published")
                        }
                      >
                        <Megaphone className="mr-2 h-4 w-4" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    {cancellable && (
                      <DropdownMenuItem
                        onClick={() =>
                          runTransition(event, "cancel", "cancelled")
                        }
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Cancel event
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {canDelete && deletable && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setDeleteEvent(event)}
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
    [router, canUpdate, canDelete, isSuperAdmin]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create campus events, submit them for approval, and publish them to
            students.
          </p>
        </div>
        {canCreate && (
          <Button asChild className="shrink-0 self-start sm:self-auto">
            <Link href="/events/create">
              <Plus className="mr-2 h-4 w-4" />
              New event
            </Link>
          </Button>
        )}
      </div>

      {/* Loading */}
      {isPending && <EventsSkeleton />}

      {/* Error */}
      {error && !isPending && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error instanceof Error
                ? error.message
                : "Failed to load events."}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Events table */}
      {!isPending && !error && (
        <GenericTable
          columns={columns}
          data={events}
          sort
          filter
          filterColumn="title"
          filterPlaceHolder="Search events…"
          filterWithSelect
          filterWithSelectFieldNames={["status"]}
          filterWithSelectFieldOptions={[STATUS_FILTER_OPTIONS]}
          pagination
        />
      )}

      {/* View details sheet */}
      <EventDetailsSheet
        event={viewEvent}
        onClose={() => setViewEvent(null)}
      />

      {/* Reject dialog */}
      <RejectEventDialog
        event={rejectEvent}
        onClose={() => setRejectEvent(null)}
      />

      {/* Delete confirm dialog */}
      <DeleteEventDialog
        event={deleteEvent}
        onClose={() => setDeleteEvent(null)}
      />
    </div>
  );
}
