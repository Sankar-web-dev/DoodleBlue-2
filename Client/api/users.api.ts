import { api, PaginationMeta } from "@/lib/api";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  roleId?: string;
  image?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface ListUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    // Server wraps the rows: data = { users: ManagedUser[] }
    return api.getWithMeta<{ users: ManagedUser[] }, PaginationMeta>(
      `/api/v1/users${query ? `?${query}` : ""}`
    );
  },
};

export const usersService = usersApi;
export const USERS_LIST_KEY = ["users", "list"] as const;
