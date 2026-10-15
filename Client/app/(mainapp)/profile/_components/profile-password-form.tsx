"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { useChangePassword } from "../_hooks/use-profile";
import { ApiRequestError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfilePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const changeMutation = useChangePassword(() => {
    setChanged(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setFormError(null);
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

    changeMutation.mutate(
      { currentPassword, newPassword },
      {
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
      }
    );
  };

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          Change Password
        </CardTitle>
        <CardDescription>Update your credentials with a new secure password</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-pwd">Current password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current-pwd"
                type={showCurrent ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter current password"
                className="h-11 rounded-xl pl-10 pr-11 border-border/80 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changeMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-pwd">New password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="new-pwd"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Min 10 characters"
                  className="h-11 rounded-xl pl-10 pr-11 border-border/80 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={changeMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  aria-label={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pwd">Confirm new password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-pwd"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  className="h-11 rounded-xl pl-10 pr-11 border-border/80 bg-background/50 focus-visible:ring-primary/40 focus-visible:border-primary"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={changeMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          {changed && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              Password updated successfully.
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="h-11 px-6 bg-primary hover:bg-primary/85 text-primary-foreground shadow-sm shadow-primary/25 transition-all rounded-xl"
              disabled={changeMutation.isPending}
            >
              {changeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating…
                </>
              ) : (
                <>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Update password
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
