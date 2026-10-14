"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Building2, Globe } from "lucide-react";

import { EVENTS_LIST_KEY } from "@/api/events.api";
import type { EventItem, EventType } from "@/api/events.api";
import { clubsApi, CLUBS_LIST_KEY } from "@/api/clubs.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createEventAction,
  updateEventAction,
} from "../_actions/events.actions";

/** Convert an ISO string to a `datetime-local` input value (local time). */
function toLocalInputValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

interface EventFormProps {
  /** Pass an existing event to edit it; undefined = create mode */
  event?: EventItem;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [eventType, setEventType] = useState<EventType>(
    event?.eventType ?? "GENERAL"
  );
  const [clubId, setClubId] = useState(event?.clubId ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [startAt, setStartAt] = useState(toLocalInputValue(event?.startAt));
  const [endAt, setEndAt] = useState(toLocalInputValue(event?.endAt));
  const [registrationDeadline, setRegistrationDeadline] = useState(
    toLocalInputValue(event?.registrationDeadline)
  );
  const [capacity, setCapacity] = useState(
    event?.capacity != null ? String(event.capacity) : ""
  );
  const [error, setError] = useState<string | null>(null);

  const { data: clubsData } = useQuery({
    queryKey: CLUBS_LIST_KEY,
    queryFn: () => clubsApi.listClubs({ isActive: true, limit: 100 }),
    enabled: eventType === "CLUB",
  });
  const clubs = clubsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createEventAction({
        title,
        description,
        eventType,
        clubId: eventType === "CLUB" ? clubId : undefined,
        venue,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : undefined,
        capacity: capacity ? Number(capacity) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_LIST_KEY });
      router.push("/events");
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateEventAction(event!.id, {
        title,
        description,
        eventType,
        clubId: eventType === "CLUB" ? clubId : null,
        venue,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline).toISOString()
          : null,
        capacity: capacity ? Number(capacity) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENTS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["events", "detail"] });
      router.push("/events");
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (title.trim().length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }
    if (!venue.trim()) {
      setError("Venue is required.");
      return;
    }
    if (eventType === "CLUB" && !clubId) {
      setError("Select a club for a club event.");
      return;
    }
    if (!startAt || !endAt) {
      setError("Start and end date/time are required.");
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError("End must be after start.");
      return;
    }
    if (capacity && Number(capacity) < 1) {
      setError("Capacity must be at least 1.");
      return;
    }
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  }

  const eventTypeOptions: { value: EventType; label: string; icon: typeof Globe }[] = [
    { value: "GENERAL", label: "General", icon: Globe },
    { value: "CLUB", label: "Club", icon: Building2 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="event-title">Title</Label>
        <Input
          id="event-title"
          placeholder="e.g. Annual Tech Fest"
          className="h-11 rounded-xl"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="event-desc">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <textarea
          id="event-desc"
          placeholder="What is this event about?"
          className="flex min-h-24 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          maxLength={1000}
        />
      </div>

      {/* Event type */}
      <div className="space-y-2">
        <Label>Event type</Label>
        <div className="flex gap-2">
          {eventTypeOptions.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setEventType(value)}
              disabled={isPending}
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-50 ${
                eventType === value
                  ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                  : "border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {eventType === "CLUB"
            ? "Only members of the selected club can see this event."
            : "Visible to all eligible students once published."}
        </p>
      </div>

      {/* Club picker */}
      {eventType === "CLUB" && (
        <div className="space-y-2">
          <Label htmlFor="event-club">Club</Label>
          <select
            id="event-club"
            className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            value={clubId}
            onChange={(e) => setClubId(e.target.value)}
            disabled={isPending}
          >
            <option value="">Select a club…</option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name} — {club.department}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Venue */}
      <div className="space-y-2">
        <Label htmlFor="event-venue">Venue</Label>
        <Input
          id="event-venue"
          placeholder="e.g. Main Auditorium"
          className="h-11 rounded-xl"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Dates */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event-start">Starts at</Label>
          <Input
            id="event-start"
            type="datetime-local"
            className="h-11 rounded-xl"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-end">Ends at</Label>
          <Input
            id="event-end"
            type="datetime-local"
            className="h-11 rounded-xl"
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="event-deadline">
            Registration deadline{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="event-deadline"
            type="datetime-local"
            className="h-11 rounded-xl"
            value={registrationDeadline}
            onChange={(e) => setRegistrationDeadline(e.target.value)}
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="event-capacity">
            Capacity <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="event-capacity"
            type="number"
            min={1}
            placeholder="e.g. 200"
            className="h-11 rounded-xl"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/events")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Create event"}
        </Button>
      </div>
    </form>
  );
}
