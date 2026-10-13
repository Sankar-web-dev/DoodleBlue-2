import { api } from "@/lib/api";
import { AuthUser } from "./auth.api";

export interface ListedUser extends AuthUser {
  createdAt: string;
}

export interface ListUsersMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  temporaryPassword: string;
  /** Optional — defaults to the system ADMIN role when not supplied. */
  roleId?: string;
}

export interface ListUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  // SUPER_ADMIN only — provisions a new admin account with the specified role.
  createAdmin: (input: CreateAdminInput) =>
    api.post<{ user: ListedUser }>("/api/v1/admins", input),

  // SUPER_ADMIN only — lists user accounts, filterable by search.
  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<{ users: ListedUser[] }, ListUsersMeta>(
      `/api/v1/admins${query ? `?${query}` : ""}`
    );
  },
};

export const usersService = usersApi;
export const USERS_LIST_KEY = ["users", "list"] as const;
