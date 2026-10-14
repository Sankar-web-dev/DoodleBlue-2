"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteMembership, type MembershipRow } from "../_hooks/use-memberships";

interface DeleteMembershipDialogProps {
  membership: MembershipRow | null;
  onClose: () => void;
}

export function DeleteMembershipDialog({
  membership,
  onClose,
}: DeleteMembershipDialogProps) {
  const deleteMutation = useDeleteMembership(onClose);

  return (
    <Dialog open={!!membership} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card/95">
        <DialogHeader>
          <DialogTitle>
            Remove {membership?.studentName ?? "this member"}?
          </DialogTitle>
          <DialogDescription>
            This removes {membership?.studentName ?? "the member"} from{" "}
            {membership?.clubName ?? "the club"}. They will lose access tied to
            this membership immediately. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              membership && deleteMutation.mutate(membership.id)
            }
            loading={deleteMutation.isPending}
            loadingText="Removing…"
          >
            Remove membership
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
