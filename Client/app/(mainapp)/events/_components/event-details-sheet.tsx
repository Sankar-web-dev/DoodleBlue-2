"use client";

import { CalendarDays, MapPin, Users, Building2, Globe } from "lucide-react";

import type { EventItem } from "@/api/events.api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import { EventStatusBadge } from "./event-status-badge";

interface EventDetailsSheetProps {
  event: EventItem | null;
  onClose: () => void;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EventDetailsSheet({ event, onClose }: EventDetailsSheetProps) {
  return (
    <Sheet open={!!event} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {event && (
          <>
            {event.imageUrl && (
              <div className="mb-4 overflow-hidden rounded-xl border border-border/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={`${event.title} image`}
                  className="h-auto w-full object-cover"
                />
              </div>
            )}
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle>{event.title}</SheetTitle>
                  <SheetDescription>
                    {event.description || "No description"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {event.eventType === "CLUB" ? (
                  <Building2 className="h-3 w-3 mr-1" />
                ) : (
                  <Globe className="h-3 w-3 mr-1" />
                )}
                {event.eventType === "CLUB" ? "Club" : "General"}
              </Badge>
              <EventStatusBadge status={event.status} />
            </div>

            <Separator className="my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  Venue
                </dt>
                <dd className="text-right">{event.venue}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Starts
                </dt>
                <dd>{formatDate(event.startAt)}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Ends
                </dt>
                <dd>{formatDate(event.endAt)}</dd>
              </div>
              {event.registrationDeadline && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">
                    Registration deadline
                  </dt>
                  <dd>{formatDate(event.registrationDeadline)}</dd>
                </div>
              )}
              {event.capacity != null && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Capacity
                  </dt>
                  <dd>{event.capacity}</dd>
                </div>
              )}
              {event.clubId && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Club</dt>
                  <dd className="font-mono text-xs">{event.clubId}</dd>
                </div>
              )}
              {event.publishedAt && (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Published at</dt>
                  <dd>{formatDate(event.publishedAt)}</dd>
                </div>
              )}
            </dl>

            {event.status === "REJECTED" && event.rejectionReason && (
              <>
                <Separator className="my-5" />
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                  <p className="text-xs font-semibold text-destructive">
                    Rejection reason
                  </p>
                  <p className="mt-1 text-sm text-destructive/90">
                    {event.rejectionReason}
                  </p>
                </div>
              </>
            )}

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(event.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(event.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
