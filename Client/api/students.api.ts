import { api, PaginationMeta } from "@/lib/api";

export type StudentStatus = "ACTIVE" | "INACTIVE";

export interface Student {
  id: string;
  studentNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  admissionDate?: string;
  status: StudentStatus;
  user: {
    id: string;
    name: string;
    mustChangePassword: boolean;
    isActive: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentInput {
  fullName: string;
  email: string;
  studentNumber: string;
  departmentId: string;
  phone?: string;
  admissionDate?: string;
  temporaryPassword: string;
}

export interface ListStudentsParams {
  search?: string;
  departmentId?: string;
  status?: StudentStatus;
  page?: number;
  limit?: number;
}

export const studentsApi = {
  createStudent: (input: CreateStudentInput) =>
    api.post<{ student: Student }>("/api/v1/students", input),

  listStudents: (params: ListStudentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.departmentId) qs.set("departmentId", params.departmentId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Student[], PaginationMeta>(
      `/api/v1/students${query ? `?${query}` : ""}`
    );
  },
};

export const studentsService = studentsApi;
export const STUDENTS_LIST_KEY = ["students", "list"] as const;
