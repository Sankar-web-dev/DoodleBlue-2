import { api, PaginationMeta } from "@/lib/api";

export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export interface AttendanceRecord {
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
  date: string;
  status: AttendanceStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordAttendanceInput {
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface ListAttendanceParams {
  studentId?: string;
  courseId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export const attendanceApi = {
  recordAttendance: (input: RecordAttendanceInput) =>
    api.post<{ attendance: AttendanceRecord }>("/api/v1/attendance", input),

  getAttendance: (id: string) =>
    api.get<{ attendance: AttendanceRecord }>(`/api/v1/attendance/${id}`),

  updateAttendance: (
    id: string,
    input: Partial<Pick<RecordAttendanceInput, "status" | "remarks">>
  ) =>
    api.patch<{ attendance: AttendanceRecord }>(
      `/api/v1/attendance/${id}`,
      input
    ),

  deleteAttendance: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/attendance/${id}`),

  listAttendance: (params: ListAttendanceParams = {}) => {
    const qs = new URLSearchParams();
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.courseId) qs.set("courseId", params.courseId);
    if (params.date) qs.set("date", params.date);
    if (params.startDate) qs.set("startDate", params.startDate);
    if (params.endDate) qs.set("endDate", params.endDate);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<AttendanceRecord[], PaginationMeta>(
      `/api/v1/attendance${query ? `?${query}` : ""}`
    );
  },
};

export const attendanceService = attendanceApi;
export const ATTENDANCE_LIST_KEY = ["attendance", "list"] as const;
