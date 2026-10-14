import { useCallback } from "react";
import type { AuthUser, RolePermission } from "@/api/auth.api";

export type Resource =
  | "roles"
  | "users"
  | "clubs"
  | "clubMemberships"
  | "events"
  | "eventRegistrations"
  | "attendance"
  | "certificates";

export type Action = "create" | "read" | "update" | "delete";

export const RESOURCE_LABELS: Record<Resource, string> = {
  roles:               "Roles",
  users:               "Users",
  clubs:               "Clubs",
  clubMemberships:     "Club Memberships",
  events:              "Events",
  eventRegistrations:  "Event Registrations",
  attendance:          "Attendance",
  certificates:        "Certificates",
};

export const ACTION_LABELS: Record<Action, string> = {
  create: "Create",
  read:   "Read",
  update: "Update",
  delete: "Delete",
};

export const ALL_RESOURCES: Resource[] = [
  "roles",
  "users",
  "clubs",
  "clubMemberships",
  "events",
  "eventRegistrations",
  "attendance",
  "certificates",
];

export const ALL_ACTIONS: Action[] = ["create", "read", "update", "delete"];

/**
 * True when the user's global role is the EVENT COORDINATOR — the role that
 * owns attendance and certificates for GENERAL events. Tolerates naming
 * variants ("Event Coordinator", "EVENT_COORDINATOR", …).
 */
export function isEventCoordinatorRole(roleName?: string): boolean {
  return (
    (roleName ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_") ===
    "EVENT_COORDINATOR"
  );
}

/**
 * Returns `can(resource, action)` and `canAny(resource)` helpers derived from
 * the authenticated user's permission matrix.
 *
 * SUPER_ADMIN always returns true for every check.
 */
export function usePermissions(user: AuthUser | null) {
  const can = useCallback(
    (resource: Resource, action: Action): boolean => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN") return true;
      const perm = user.permissions.find((p: RolePermission) => p.resource === resource);
      return perm?.actions.includes(action) ?? false;
    },
    [user]
  );

  const canAny = useCallback(
    (resource: Resource): boolean => {
      if (!user) return false;
      if (user.role === "SUPER_ADMIN") return true;
      return user.permissions.some((p: RolePermission) => p.resource === resource);
    },
    [user]
  );

  return { can, canAny };
}

/**
 * Build a flat permissions array from a permission matrix object (used in the
 * create/edit role form).
 */
export function matrixToPermissions(
  matrix: Record<Resource, Record<Action, boolean>>
): RolePermission[] {
  return ALL_RESOURCES.flatMap((resource) => {
    const actions = ALL_ACTIONS.filter((action) => matrix[resource]?.[action]);
    if (actions.length === 0) return [];
    return [{ resource, actions }];
  });
}

/**
 * Convert a permissions array back to a matrix (for pre-filling the form).
 */
export function permissionsToMatrix(
  permissions: RolePermission[]
): Record<Resource, Record<Action, boolean>> {
  const matrix = {} as Record<Resource, Record<Action, boolean>>;
  for (const resource of ALL_RESOURCES) {
    matrix[resource] = { create: false, read: false, update: false, delete: false };
  }
  for (const perm of permissions) {
    if (matrix[perm.resource as Resource]) {
      for (const action of perm.actions) {
        matrix[perm.resource as Resource][action as Action] = true;
      }
    }
  }
  return matrix;
}
