"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { EventItem } from "@/api/events.api";
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
import { useRejectEvent } from "../_hooks/use-events";

interface RejectEventDialogProps {
  event: EventItem | null;
  onClose: () => void;
}

export function RejectEventDialog({ event, onClose }: RejectEventDialogProps) {
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectEvent(onClose);

  useEffect(() => {
    if (!event) setReason("");
  }, [event]);

  function handleReject() {
    if (!event || !reason.trim()) return;
    rejectMutation.mutate(
      { id: event.id, reason },
      {
        onSuccess: () => toast.success(`"${event.title}" rejected`),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Reject failed"),
      }
    );
  }

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Reject &ldquo;{event?.title}&rdquo;?</DialogTitle>
          <DialogDescription>
            The event will move back to Rejected. The creator can edit and
            resubmit it.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="reject-reason">Reason</Label>
          <Input
            id="reject-reason"
            placeholder="Why is this event being rejected?"
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
            Reject event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
