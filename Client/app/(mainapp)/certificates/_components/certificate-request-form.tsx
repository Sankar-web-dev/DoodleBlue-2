"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { CERTIFICATES_LIST_KEY } from "@/api/certificates.api";
import { eventsApi } from "@/api/events.api";
import { usersApi } from "@/api/users.api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { requestCertificateAction } from "../_actions/certificates.actions";

const selectClassName =
  "flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

export function CertificateRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [eventId, setEventId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: eventsData, isPending: eventsPending } = useQuery({
    queryKey: ["events", "options"],
    queryFn: () => eventsApi.listEvents({ limit: 100 }),
  });
  const { data: usersData, isPending: usersPending } = useQuery({
    queryKey: ["users", "options"],
    queryFn: () => usersApi.listUsers({ limit: 100 }),
  });

  const events = eventsData?.data ?? [];
  const students = usersData?.data ?? [];

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
          {events.map((ev) => (
            <option key={ev.id} value={ev.id}>
              {ev.title} —{" "}
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
          disabled={requestMutation.isPending || usersPending}
        >
          <option value="">
            {usersPending ? "Loading students…" : "Select a student…"}
          </option>
          {students.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.email}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          The student must be registered for the event and marked present
          before a certificate can be requested.
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
