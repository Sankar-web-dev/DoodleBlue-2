import { useCallback } from "react";
import type { AuthUser, RolePermission } from "@/api/auth.api";

export type Resource =
  | "students"
  | "courses"
  | "departments"
  | "enrollments"
  | "analytics"
  | "attendance"
  | "admins"
  | "roles"
  | "users";

export type Action = "create" | "read" | "update" | "delete";

export const RESOURCE_LABELS: Record<Resource, string> = {
  students:    "Students",
  courses:     "Courses",
  departments: "Departments",
  enrollments: "Enrollments",
  analytics:   "Analytics",
  attendance:  "Attendance",
  admins:      "Admins",
  roles:       "Roles",
  users:       "Users",
};

export const ACTION_LABELS: Record<Action, string> = {
  create: "Create",
  read:   "Read",
  update: "Update",
  delete: "Delete",
};

export const ALL_RESOURCES: Resource[] = [
  "students",
  "courses",
  "departments",
  "enrollments",
  "analytics",
  "attendance",
  "admins",
  "roles",
  "users",
];

export const ALL_ACTIONS: Action[] = ["create", "read", "update", "delete"];

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
