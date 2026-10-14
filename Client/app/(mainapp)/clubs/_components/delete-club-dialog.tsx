"use client";

import { Loader2 } from "lucide-react";

import type { Club } from "@/api/clubs.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteClub } from "../_hooks/use-clubs";

interface DeleteClubDialogProps {
  club: Club | null;
  onClose: () => void;
}

export function DeleteClubDialog({ club, onClose }: DeleteClubDialogProps) {
  const deleteMutation = useDeleteClub(onClose);

  return (
    <Dialog open={!!club} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{club?.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the club. This cannot be undone. Clubs
            with memberships or events must be deactivated instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => club && deleteMutation.mutate(club.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete club
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
