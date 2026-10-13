import { api, PaginationMeta } from "@/lib/api";

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  department: {
    id: string;
    name?: string;
    code?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  name: string;
  code: string;
  description?: string;
  departmentId: string;
}

export interface UpdateCourseInput {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

export interface ListCoursesParams {
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const coursesApi = {
  // SUPER_ADMIN + ADMIN — creates a course under a department.
  createCourse: (input: CreateCourseInput) =>
    api.post<{ course: Course }>("/api/v1/courses", input),

  // SUPER_ADMIN + ADMIN — rename, edit description and/or activate/deactivate.
  updateCourse: (id: string, input: UpdateCourseInput) =>
    api.patch<{ course: Course }>(`/api/v1/courses/${id}`, input),

  // SUPER_ADMIN + ADMIN — hard delete.
  deleteCourse: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/courses/${id}`),

  // SUPER_ADMIN + ADMIN — lists courses with pagination and filters.
  listCourses: (params: ListCoursesParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.departmentId) qs.set("departmentId", params.departmentId);
    if (params.isActive !== undefined) {
      qs.set("isActive", String(params.isActive));
    }
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Course[], PaginationMeta>(
      `/api/v1/courses${query ? `?${query}` : ""}`
    );
  },
};

export const coursesService = coursesApi;
export const COURSES_LIST_KEY = ["courses", "list"] as const;
