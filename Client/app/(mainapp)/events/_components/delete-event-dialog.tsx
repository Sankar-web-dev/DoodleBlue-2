"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { EventItem } from "@/api/events.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteEvent } from "../_hooks/use-events";

interface DeleteEventDialogProps {
  event: EventItem | null;
  onClose: () => void;
}

export function DeleteEventDialog({ event, onClose }: DeleteEventDialogProps) {
  const deleteMutation = useDeleteEvent(onClose);

  return (
    <Dialog open={!!event} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{event?.title}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the event. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              event &&
              deleteMutation.mutate(event.id, {
                onError: (err) =>
                  toast.error(
                    err instanceof Error ? err.message : "Delete failed"
                  ),
              })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
