"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, Loader2, Hash } from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";
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

export function CreateDepartmentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      departmentsService.createDepartment({
        name: name.trim(),
        code: code.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      setName("");
      setCode("");
      setFormError(null);
      toast.success("Department created");
      onClose();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "CODE_IN_USE"
            ? "That code is already taken by another department."
            : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter a department name (min 2 characters).");
      return;
    }
    if (!/^[A-Za-z0-9-]{2,20}$/.test(code.trim())) {
      setFormError(
        "Enter a code — 2 to 20 letters, numbers or hyphens (e.g. CSE)."
      );
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  const closeAndReset = () => {
    onClose();
    setName("");
    setCode("");
    setFormError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create department
          </DialogTitle>
          <DialogDescription>
            Departments group students and courses. The code is a short unique
            identifier and can&apos;t be changed later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              placeholder="e.g. Computer Science"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dept-code">Code</Label>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dept-code"
                placeholder="CSE"
                className="h-11 rounded-xl pl-10 font-mono text-sm uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Unique, stored uppercase · permanent once created
            </p>
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4" />
                Create department
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
