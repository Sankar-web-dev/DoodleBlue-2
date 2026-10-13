"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";

import { rolesApi, Role, ROLES_LIST_KEY } from "@/api/roles.api";
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
import {
  ALL_RESOURCES,
  ALL_ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
  matrixToPermissions,
  permissionsToMatrix,
  Resource,
  Action,
} from "@/lib/permissions";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass an existing role to edit it; undefined = create mode */
  role?: Role;
}

type Matrix = Record<Resource, Record<Action, boolean>>;

function emptyMatrix(): Matrix {
  const m = {} as Matrix;
  for (const r of ALL_RESOURCES) {
    m[r] = { create: false, read: false, update: false, delete: false };
  }
  return m;
}

export function CreateRoleCard({ open, onClose, role }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!role;

  const [name, setName]               = useState("");
  const [description, setDescription] = useState("");
  const [matrix, setMatrix]           = useState<Matrix>(emptyMatrix());
  const [error, setError]             = useState<string | null>(null);

  // Pre-fill when editing
  useEffect(() => {
    if (open) {
      if (role) {
        setName(role.name);
        setDescription(role.description);
        setMatrix(permissionsToMatrix(role.permissions));
      } else {
        setName("");
        setDescription("");
        setMatrix(emptyMatrix());
      }
      setError(null);
    }
  }, [open, role]);

  const createMutation = useMutation({
    mutationFn: () =>
      rolesApi.createRole({
        name: name.trim(),
        description: description.trim(),
        permissions: matrixToPermissions(matrix),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      rolesApi.updateRole(role!.id, {
        name: name.trim(),
        description: description.trim(),
        permissions: matrixToPermissions(matrix),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      onClose();
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function toggle(resource: Resource, action: Action) {
    setMatrix((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: !prev[resource][action],
      },
    }));
  }

  function toggleRow(resource: Resource) {
    const allOn = ALL_ACTIONS.every((a) => matrix[resource][a]);
    setMatrix((prev) => ({
      ...prev,
      [resource]: Object.fromEntries(
        ALL_ACTIONS.map((a) => [a, !allOn])
      ) as Record<Action, boolean>,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Role name is required.");
      return;
    }

    const permissions = matrixToPermissions(matrix);
    if (permissions.length === 0) {
      setError("Select at least one permission.");
      return;
    }

    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {isEdit ? "Edit role" : "Create role"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the name and permission matrix for this role."
              : "Define a new role and choose exactly what it can access."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              placeholder="e.g. Faculty Manager"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending || (isEdit && role?.isSystem)}
            />
            {isEdit && role?.isSystem && (
              <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="role-desc">
              Description <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="role-desc"
              placeholder="Short description of what this role can do"
              className="h-11 rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>

          {/* Permission matrix */}
          <div className="space-y-2">
            <Label>Permissions</Label>
            <div className="overflow-hidden rounded-xl border border-border/60">
              {/* Header row */}
              <div className="grid grid-cols-[1fr_repeat(4,_64px)] border-b border-border/60 bg-muted/50 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                <span>Resource</span>
                {ALL_ACTIONS.map((a) => (
                  <span key={a} className="text-center">{ACTION_LABELS[a]}</span>
                ))}
              </div>

              {/* Resource rows */}
              {ALL_RESOURCES.map((resource, i) => {
                const allOn = ALL_ACTIONS.every((a) => matrix[resource][a]);
                return (
                  <div
                    key={resource}
                    className={`grid grid-cols-[1fr_repeat(4,_64px)] items-center px-4 py-2.5 ${
                      i !== ALL_RESOURCES.length - 1 ? "border-b border-border/40" : ""
                    } ${i % 2 === 0 ? "bg-background/40" : "bg-muted/20"}`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleRow(resource)}
                      className="flex items-center gap-2 text-left text-sm font-medium transition-colors hover:text-primary"
                      title={allOn ? "Deselect all" : "Select all"}
                    >
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                          allOn
                            ? "bg-primary"
                            : ALL_ACTIONS.some((a) => matrix[resource][a])
                            ? "bg-primary/40"
                            : "bg-muted-foreground/30"
                        }`}
                      />
                      {RESOURCE_LABELS[resource]}
                    </button>
                    {ALL_ACTIONS.map((action) => {
                      const on = matrix[resource][action];
                      return (
                        <div key={action} className="flex justify-center">
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            aria-label={`${RESOURCE_LABELS[resource]} — ${ACTION_LABELS[action]}`}
                            disabled={isPending}
                            onClick={() => toggle(resource, action)}
                            className={`flex h-6 w-11 items-center justify-center rounded-md border text-[10px] font-semibold transition-all disabled:opacity-50 ${
                              on
                                ? "border-primary bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                : "border-border/70 bg-muted/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                            }`}
                          >
                            {ACTION_LABELS[action][0]}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Click a resource name to toggle all its actions at once.
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
