"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { EventRegistration } from "@/api/event-registrations.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReviewRegistration } from "../_hooks/use-registrations";

interface RejectRegistrationDialogProps {
  registration: EventRegistration | null;
  onClose: () => void;
}

export function RejectRegistrationDialog({
  registration,
  onClose,
}: RejectRegistrationDialogProps) {
  const [reason, setReason] = useState("");
  const rejectMutation = useReviewRegistration(onClose);

  useEffect(() => {
    if (!registration) setReason("");
  }, [registration]);

  function handleReject() {
    if (!registration || !reason.trim()) return;
    rejectMutation.mutate(
      { id: registration.id, status: "REJECTED", reason },
      {
        onSuccess: () =>
          toast.success(
            `Registration for "${registration.event?.title ?? "event"}" rejected`
          ),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Reject failed"),
      }
    );
  }

  return (
    <Dialog open={!!registration} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>
            Reject {registration?.student?.name ?? "student"}?
          </DialogTitle>
          <DialogDescription>
            Their registration for &ldquo;
            {registration?.event?.title ?? "this event"}&rdquo; will be
            rejected.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reg-reject-reason">Reason</Label>
          <Input
            id="reg-reject-reason"
            placeholder="Why is this registration being rejected?"
            className="h-11 rounded-xl"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={rejectMutation.isPending}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={rejectMutation.isPending || !reason.trim()}
          >
            {rejectMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Reject registration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
