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
import { useCertificateDecision } from "../_hooks/use-certificates";

interface IssueCertificateDialogProps {
  certificate: CertificateItem | null;
  onClose: () => void;
}

export function IssueCertificateDialog({
  certificate,
  onClose,
}: IssueCertificateDialogProps) {
  const [certificateUrl, setCertificateUrl] = useState("");
  const decision = useCertificateDecision(onClose);

  useEffect(() => {
    if (!certificate) setCertificateUrl("");
  }, [certificate]);

  function handleIssue() {
    if (!certificate) return;
    decision.mutate(
      { id: certificate.id, action: "issue", certificateUrl },
      {
        onSuccess: () => toast.success("Certificate issued"),
        onError: (err) =>
          toast.error(err instanceof Error ? err.message : "Issue failed"),
      }
    );
  }

  return (
    <Dialog open={!!certificate} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md border-border/70 bg-card">
        <DialogHeader>
          <DialogTitle>Issue certificate?</DialogTitle>
          <DialogDescription>
            A unique certificate number will be generated. Optionally attach a
            download link.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="cert-url">
            Certificate URL{" "}
            <span className="text-muted-foreground">(optional)</span>
          </Label>
          <Input
            id="cert-url"
            type="url"
            placeholder="https://…"
            className="h-11 rounded-xl"
            value={certificateUrl}
            onChange={(e) => setCertificateUrl(e.target.value)}
            disabled={decision.isPending}
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleIssue} disabled={decision.isPending}>
            {decision.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Issue certificate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
