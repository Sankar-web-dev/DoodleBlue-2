"use client";

import { Loader2 } from "lucide-react";

import type { Role } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteRole } from "../_hooks/use-roles";

interface DeleteRoleDialogProps {
  role: Role | null;
  onClose: () => void;
}

export function DeleteRoleDialog({ role, onClose }: DeleteRoleDialogProps) {
  const deleteMutation = useDeleteRole(onClose);

  return (
    <Dialog open={!!role} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Delete &ldquo;{role?.name}&rdquo;?</DialogTitle>
          <DialogDescription>
            This will permanently remove the role. Users assigned to this role will lose their
            permissions immediately. This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => role && deleteMutation.mutate(role.id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
