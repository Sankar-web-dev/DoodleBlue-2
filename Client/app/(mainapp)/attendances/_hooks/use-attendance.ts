import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  attendanceApi,
  ATTENDANCE_LIST_KEY,
  type AttendanceStatus,
  type ListAttendanceParams,
} from "@/api/attendance.api";
import {
  markAttendanceAction,
  updateAttendanceAction,
  deleteAttendanceAction,
} from "../_actions/attendance.actions";

export function useAttendance(
  params: ListAttendanceParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: [...ATTENDANCE_LIST_KEY, params],
    queryFn: () => attendanceApi.listAttendance({ limit: 100, ...params }),
    enabled,
  });
}

function useInvalidateAttendance() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: ATTENDANCE_LIST_KEY });
}

export function useMarkAttendance(onSuccess?: () => void) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: ({
      eventId,
      studentId,
      status,
    }: {
      eventId: string;
      studentId: string;
      status: AttendanceStatus;
    }) => markAttendanceAction(eventId, studentId, status),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useUpdateAttendance(onSuccess?: () => void) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AttendanceStatus }) =>
      updateAttendanceAction(id, status),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useDeleteAttendance(onSuccess?: () => void) {
  const invalidate = useInvalidateAttendance();
  return useMutation({
    mutationFn: (id: string) => deleteAttendanceAction(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
