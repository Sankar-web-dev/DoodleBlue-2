"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { ROLES_LIST_KEY } from "@/api/roles.api";
import type { Role } from "@/api/roles.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALL_RESOURCES,
  ALL_ACTIONS,
  RESOURCE_LABELS,
  ACTION_LABELS,
  matrixToPermissions,
  permissionsToMatrix,
  type Resource,
  type Action,
} from "@/lib/permissions";
import {
  createRoleAction,
  updateRoleAction,
  type Matrix,
} from "../_actions/roles.actions";

function emptyMatrix(): Matrix {
  const m = {} as Matrix;
  for (const r of ALL_RESOURCES) {
    m[r] = { create: false, read: false, update: false, delete: false };
  }
  return m;
}

const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(60, "Role name is too long."),
  description: z.string().trim().max(200, "Description is too long."),
  matrix: z
    .custom<Matrix>((v) => typeof v === "object" && v !== null)
    .refine(
      (m) => matrixToPermissions(m).length > 0,
      "Select at least one permission."
    ),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormProps {
  /** Pass an existing role to edit it; undefined = create mode */
  role?: Role;
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!role;

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name ?? "",
      description: role?.description ?? "",
      matrix: role ? permissionsToMatrix(role.permissions) : emptyMatrix(),
    },
  });

  const { errors } = form.formState;
  const matrix = form.watch("matrix");

  const createMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      createRoleAction(values.name, values.description, values.matrix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      router.push("/roles");
    },
    onError: (err: Error) =>
      form.setError("root.serverError", { message: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (values: RoleFormValues) =>
      updateRoleAction(role!.id, values.name, values.description, values.matrix),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      router.push("/roles");
    },
    onError: (err: Error) =>
      form.setError("root.serverError", { message: err.message }),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function toggle(resource: Resource, action: Action) {
    const current = form.getValues("matrix");
    form.setValue(
      "matrix",
      {
        ...current,
        [resource]: { ...current[resource], [action]: !current[resource][action] },
      },
      { shouldValidate: true }
    );
  }

  function toggleRow(resource: Resource) {
    const current = form.getValues("matrix");
    const allOn = ALL_ACTIONS.every((a) => current[resource][a]);
    form.setValue(
      "matrix",
      {
        ...current,
        [resource]: Object.fromEntries(
          ALL_ACTIONS.map((a) => [a, !allOn])
        ) as Record<Action, boolean>,
      },
      { shouldValidate: true }
    );
  }

  function onSubmit(values: RoleFormValues) {
    if (isEdit) updateMutation.mutate(values);
    else createMutation.mutate(values);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="role-name">Role name</Label>
        <Input
          id="role-name"
          placeholder="e.g. Faculty Manager"
          className="h-11 rounded-xl"
          disabled={isPending || (isEdit && role?.isSystem)}
          {...form.register("name")}
        />
        {errors.name ? (
          <p className="text-xs font-medium text-destructive">
            {errors.name.message}
          </p>
        ) : (
          isEdit &&
          role?.isSystem && (
            <p className="text-xs text-muted-foreground">
              System role names cannot be changed.
            </p>
          )
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
          disabled={isPending}
          {...form.register("description")}
        />
        {errors.description && (
          <p className="text-xs font-medium text-destructive">
            {errors.description.message}
          </p>
        )}
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
        {errors.matrix && (
          <p className="text-xs font-medium text-destructive">
            {errors.matrix.message}
          </p>
        )}
      </div>

      {errors.root?.serverError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errors.root.serverError.message}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/roles")}
          disabled={isPending}
        >
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
      </div>
    </form>
  );
}
