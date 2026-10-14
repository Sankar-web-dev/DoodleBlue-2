import { api, PaginationMeta } from "@/lib/api";

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceRecord {
  id: string;
  eventId: string;
  studentId: string;
  markedBy: string;
  /** Populated by the server — saves clients needing events:read/users:read. */
  event?: {
    id: string;
    title: string;
    eventType: "CLUB" | "GENERAL";
    venue: string;
    startAt: string;
  };
  student?: { id: string; name: string; email: string };
  markedByUser?: { id: string; name: string };
  status: AttendanceStatus;
  markedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarkAttendanceInput {
  eventId: string;
  studentId: string;
  status: AttendanceStatus;
}

export interface ListAttendanceParams {
  eventId?: string;
  studentId?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export const attendanceApi = {
  markAttendance: (input: MarkAttendanceInput) =>
    api.post<{ attendance: AttendanceRecord }>("/api/v1/attendance", input),

  listAttendance: (params: ListAttendanceParams = {}) => {
    const qs = new URLSearchParams();
    if (params.eventId) qs.set("eventId", params.eventId);
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<AttendanceRecord[], PaginationMeta>(
      `/api/v1/attendance${query ? `?${query}` : ""}`
    );
  },

  updateAttendance: (id: string, status: AttendanceStatus) =>
    api.patch<{ attendance: AttendanceRecord }>(`/api/v1/attendance/${id}`, {
      status,
    }),

  deleteAttendance: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/attendance/${id}`),
};

export const attendanceService = attendanceApi;
export const ATTENDANCE_LIST_KEY = ["attendance", "list"] as const;
