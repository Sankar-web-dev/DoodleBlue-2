"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
  Department,
} from "@/api/departments.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function EditDepartmentDialog({
  department,
  onClose,
}: {
  department: Department | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the input whenever a different row is opened.
  useEffect(() => {
    setName(department?.name ?? "");
    setFormError(null);
  }, [department]);

  const updateMutation = useMutation({
    mutationFn: () =>
      departmentsService.updateDepartment(department!.id, {
        name: name.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success("Department renamed");
      onClose();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
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
    setFormError(null);
    updateMutation.mutate();
  };

  return (
    <Dialog open={department !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Rename department</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono">{department?.code}</span> stays
            the same — it&apos;s the permanent identifier.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-dept-name">Department name</Label>
            <Input
              id="edit-dept-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteDepartmentDialog({
  department,
  onClose,
  onDeactivate,
}: {
  department: Department | null;
  onClose: () => void;
  onDeactivate: (department: Department) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [inUse, setInUse] = useState(false);

  useEffect(() => {
    setFormError(null);
    setInUse(false);
  }, [department]);

  const deleteMutation = useMutation({
    mutationFn: () => departmentsService.deleteDepartment(department!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_KEY });
      toast.success("Department deleted");
      onClose();
    },
    onError: (error) => {
      if (
        error instanceof ApiRequestError &&
        error.code === "DEPARTMENT_IN_USE"
      ) {
        setInUse(true);
        setFormError(error.message);
      } else {
        setFormError(
          error instanceof ApiRequestError
            ? error.message
            : "Something went wrong. Please try again."
        );
      }
    },
  });

  return (
    <Dialog open={department !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {department?.name}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the department. If students or courses
            still reference it, deactivate it instead to keep their history.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          {inUse && department?.isActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => department && onDeactivate(department)}
            >
              Deactivate instead
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
