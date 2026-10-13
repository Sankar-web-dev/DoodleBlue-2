import { rolesApi } from "@/api/roles.api";
import { matrixToPermissions } from "@/lib/permissions";
import type { Resource, Action } from "@/lib/permissions";

export type Matrix = Record<Resource, Record<Action, boolean>>;

export async function createRoleAction(
  name: string,
  description: string,
  matrix: Matrix
) {
  return rolesApi.createRole({
    name: name.trim(),
    description: description.trim(),
    permissions: matrixToPermissions(matrix),
  });
}

export async function updateRoleAction(
  id: string,
  name: string,
  description: string,
  matrix: Matrix
) {
  return rolesApi.updateRole(id, {
    name: name.trim(),
    description: description.trim(),
    permissions: matrixToPermissions(matrix),
  });
}

export async function deleteRoleAction(id: string) {
  return rolesApi.deleteRole(id);
}
