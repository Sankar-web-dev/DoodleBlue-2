import { api, PaginationMeta } from "@/lib/api";
import { Student } from "./students.api";
import { Enrollment } from "./enrollments.api";
import { AttendanceRecord } from "./attendance.api";

export interface MyEnrollmentsParams {
  page?: number;
  limit?: number;
}

export interface MyAttendanceParams {
  courseId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const meApi = {
  getProfile: () => api.get<{ student: Student }>("/api/v1/me/profile"),

  getEnrollments: (params: MyEnrollmentsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Enrollment[], PaginationMeta>(
      `/api/v1/me/enrollments${query ? `?${query}` : ""}`
    );
  },

  getAttendance: (params: MyAttendanceParams = {}) => {
    const qs = new URLSearchParams();
    if (params.courseId) qs.set("courseId", params.courseId);
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<AttendanceRecord[], PaginationMeta>(
      `/api/v1/me/attendance${query ? `?${query}` : ""}`
    );
  },
};

export const meService = meApi;
export const ME_PROFILE_KEY = ["me", "profile"] as const;
export const ME_ENROLLMENTS_KEY = ["me", "enrollments"] as const;
export const ME_ATTENDANCE_KEY = ["me", "attendance"] as const;
