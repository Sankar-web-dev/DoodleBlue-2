"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { authService } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const changeMutation = useMutation({
    mutationFn: () =>
      authService.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      setChanged(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFormError(null);
      toast.success("Password changed", {
        description: "You can continue using the app with your new password.",
      });
    },
    onError: (error) => {
      setChanged(false);
      if (error instanceof ApiRequestError) {
        if (error.code === "INCORRECT_CURRENT_PASSWORD") {
          setFormError("Current password is incorrect.");
        } else if (error.code === "PASSWORD_UNCHANGED") {
          setFormError("New password must be different from the current one.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setFormError("Enter your current password.");
      return;
    }
    if (newPassword.length < 10) {
      setFormError("New password must be at least 10 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }
    setFormError(null);
    setChanged(false);
    changeMutation.mutate();
  };

  const closeAndReset = () => {
    onClose();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setFormError(null);
    setChanged(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="sm:max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Change password
          </DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new one.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="cp-current">Current password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cp-current"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter current password"
                className="h-11 rounded-xl pl-10 pr-11 border-border/70 focus-visible:ring-primary"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changeMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-new">New password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cp-new"
                type={showNew ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min 10 characters"
                className="h-11 rounded-xl pl-10 pr-11 border-border/70 focus-visible:ring-primary"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changeMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cp-confirm">Confirm new password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="cp-confirm"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Repeat new password"
                className="h-11 rounded-xl pl-10 pr-11 border-border/70 focus-visible:ring-primary"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={changeMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          {changed && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
              Password updated successfully.
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            disabled={changeMutation.isPending}
          >
            {changeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Changing…
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Change password
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
