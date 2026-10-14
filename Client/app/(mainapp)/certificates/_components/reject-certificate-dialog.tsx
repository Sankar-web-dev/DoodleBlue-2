"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { CertificateItem } from "@/api/certificates.api";
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
import { useRejectCertificate } from "../_hooks/use-certificates";

interface RejectCertificateDialogProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export function RejectCertificateDialog({
  certificate,
  onClose,
}: RejectCertificateDialogProps) {
  const [reason, setReason] = useState("");
  const rejectMutation = useRejectCertificate(onClose);

  useEffect(() => {
    if (!certificate) setReason("");
  }, [certificate]);

  function handleReject() {
    if (!certificate || !reason.trim()) return;
    rejectMutation.mutate(
      { id: certificate.id, reason },
      {
        onSuccess: () => toast.success("Certificate rejected"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Reject failed"),
      }
    );
  }

  return (
    <Dialog open={!!certificate} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Reject certificate request?</DialogTitle>
          <DialogDescription>
            The request will move to Rejected. The student keeps their
            registration and attendance records.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cert-reject-reason">Reason</Label>
          <Input
            id="cert-reject-reason"
            placeholder="Why is this request being rejected?"
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
            Reject request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
