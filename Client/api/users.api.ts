import { api, PaginationMeta } from "@/lib/api";

export interface User {
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

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  image?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  roleId?: string;
  image?: string;
  isActive?: boolean;
}

export interface ListUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export const usersApi = {
  createUser: (input: CreateUserInput) =>
    api.post<{ user: User }>("/api/v1/users", input),

  updateUser: (id: string, input: UpdateUserInput) =>
    api.patch<{ user: User }>(`/api/v1/users/${id}`, input),

  getUser: (id: string) =>
    api.get<{ user: User }>(`/api/v1/users/${id}`),

  deleteUser: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/users/${id}`),

  listUsers: (params: ListUsersParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<User[], PaginationMeta>(
      `/api/v1/users${query ? `?${query}` : ""}`
    );
  },
};

export const usersService = usersApi;
export const USERS_LIST_KEY = ["users", "list"] as const;
