import { attendanceApi } from "@/api/attendance.api";
import type { AttendanceStatus } from "@/api/attendance.api";

export async function markAttendanceAction(
  eventId: string,
  studentId: string,
  status: AttendanceStatus
) {
  return attendanceApi.markAttendance({ eventId, studentId, status });
}

export async function updateAttendanceAction(
  id: string,
  status: AttendanceStatus
) {
  return attendanceApi.updateAttendance(id, status);
}

export async function deleteAttendanceAction(id: string) {
  return attendanceApi.deleteAttendance(id);
}
