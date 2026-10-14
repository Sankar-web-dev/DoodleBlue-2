"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { CertificateItem } from "@/api/certificates.api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteCertificate } from "../_hooks/use-certificates";

interface DeleteCertificateDialogProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export function DeleteCertificateDialog({
  certificate,
  onClose,
}: DeleteCertificateDialogProps) {
  const deleteMutation = useDeleteCertificate(onClose);

  return (
    <Dialog open={!!certificate} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>
            Delete {certificate?.certificateNumber ?? "this certificate"}?
          </DialogTitle>
          <DialogDescription>
            This will permanently remove the certificate record. This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() =>
              certificate &&
              deleteMutation.mutate(certificate.id, {
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
            Delete certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
