import { api, PaginationMeta } from "@/lib/api";

export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "WITHDRAWN";

export interface Enrollment {
  id: string;
  student: {
    id: string;
    fullName?: string;
    studentNumber?: string;
  };
  course: {
    id: string;
    name?: string;
    code?: string;
  };
  status: EnrollmentStatus;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEnrollmentInput {
  studentId: string;
  courseId: string;
}

export interface ListEnrollmentsParams {
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus;
  page?: number;
  limit?: number;
}

export const enrollmentsApi = {
  createEnrollment: (input: CreateEnrollmentInput) =>
    api.post<{ enrollment: Enrollment }>("/api/v1/enrollments", input),

  updateEnrollmentStatus: (id: string, status: EnrollmentStatus) =>
    api.patch<{ enrollment: Enrollment }>(`/api/v1/enrollments/${id}`, {
      status,
    }),

  deleteEnrollment: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/enrollments/${id}`),

  listEnrollments: (params: ListEnrollmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.courseId) qs.set("courseId", params.courseId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Enrollment[], PaginationMeta>(
      `/api/v1/enrollments${query ? `?${query}` : ""}`
    );
  },
};

export const enrollmentsService = enrollmentsApi;
export const ENROLLMENTS_LIST_KEY = ["enrollments", "list"] as const;
