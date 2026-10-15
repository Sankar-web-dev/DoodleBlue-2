"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { CERTIFICATES_LIST_KEY } from "@/api/certificates.api";
import { useAuthUser } from "@/lib/use-auth-user";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { useManageableEvents } from "../../_components/use-manageable-events";
import { useAttendance } from "../../attendances/_hooks/use-attendance";
import { requestCertificateAction } from "../_actions/certificates.actions";

const selectClassName =
  "flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CertificateRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { user } = useAuthUser();

  const [eventId, setEventId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Scoped like attendance marking: event coordinator → general events,
  // club coordinator/faculty → their club events, super admin → all.
  const { events, isPending: eventsPending } = useManageableEvents(user);

  // Only students marked PRESENT for the chosen event are eligible —
  // populated attendance records give their names without users:read.
  const attendanceQuery = useAttendance(
    { eventId, status: "PRESENT" },
    !!eventId
  );
  const students = (attendanceQuery.data?.data ?? [])
    .map((r) => r.student)
    .filter((s): s is NonNullable<typeof s> => !!s);
  const studentsPending = !!eventId && attendanceQuery.isPending;

  const requestMutation = useMutation({
    mutationFn: () => requestCertificateAction({ eventId, studentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CERTIFICATES_LIST_KEY });
      router.push("/certificates");
    },
    onError: (err: Error) => setError(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!eventId) {
      setError("Select an event.");
      return;
    }
    if (!studentId) {
      setError("Select a student.");
      return;
    }
    requestMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Event */}
      <div className="space-y-2">
        <Label htmlFor="cert-event">Event</Label>
        <select
          id="cert-event"
          className={selectClassName}
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          disabled={requestMutation.isPending || eventsPending}
        >
          <option value="">
            {eventsPending ? "Loading events…" : "Select an event…"}
          </option>
          {events.length === 0 && !eventsPending ? (
            <option disabled>No manageable events found</option>
          ) : null}
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title}
              {ev.eventType === "CLUB" ? " — Club" : " — General"} —{" "}
              {new Date(ev.startAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </option>
          ))}
        </select>
      </div>

      {/* Student */}
      <div className="space-y-2">
        <Label htmlFor="cert-student">Student</Label>
        <select
          id="cert-student"
          className={selectClassName}
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={requestMutation.isPending || studentsPending || !eventId}
        >
          <option value="">
            {!eventId
              ? "Select an event first"
              : studentsPending
                ? "Loading attendees…"
                : students.length === 0
                  ? "No present attendees for this event"
                  : "Select a student…"}
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — {s.email}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Only students marked present for the event are eligible for a
          certificate.
        </p>
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
          onClick={() => router.push("/certificates")}
          disabled={requestMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          disabled={requestMutation.isPending}
        >
          {requestMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create certificate
        </Button>
      </div>
    </form>
  );
}
