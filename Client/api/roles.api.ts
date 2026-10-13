import { api, PaginationMeta } from "@/lib/api";
import type { RolePermission } from "./auth.api";

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: RolePermission[];
  isSystem: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: RolePermission[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: RolePermission[];
  isActive?: boolean;
}

export interface ListRolesParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const rolesApi = {
  createRole: (input: CreateRoleInput) =>
    api.post<{ role: Role }>("/api/v1/roles", input),

  updateRole: (id: string, input: UpdateRoleInput) =>
    api.patch<{ role: Role }>(`/api/v1/roles/${id}`, input),

  deleteRole: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/roles/${id}`),

  getRole: (id: string) =>
    api.get<{ role: Role }>(`/api/v1/roles/${id}`),

  listRoles: (params: ListRolesParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Role[], PaginationMeta>(
      `/api/v1/roles${query ? `?${query}` : ""}`
    );
  },
};

export const rolesService = rolesApi;
export const ROLES_LIST_KEY = ["roles", "list"] as const;
