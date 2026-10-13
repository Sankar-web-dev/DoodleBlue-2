import { api, PaginationMeta } from "@/lib/api";

export interface Department {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentInput {
  name: string;
  code: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  isActive?: boolean;
}

export interface ListDepartmentsParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const departmentsApi = {
  createDepartment: (input: CreateDepartmentInput) =>
    api.post<{ department: Department }>("/api/v1/departments", input),

  updateDepartment: (id: string, input: UpdateDepartmentInput) =>
    api.patch<{ department: Department }>(`/api/v1/departments/${id}`, input),

  deleteDepartment: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/departments/${id}`),

  listDepartments: (params: ListDepartmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.isActive !== undefined) {
      qs.set("isActive", String(params.isActive));
    }
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Department[], PaginationMeta>(
      `/api/v1/departments${query ? `?${query}` : ""}`
    );
  },
};

export const departmentsService = departmentsApi;
export const DEPARTMENTS_LIST_KEY = ["departments", "list"] as const;
