import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import {
  attendanceApi,
  ATTENDANCE_LIST_KEY,
  type AttendanceRecord,
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

interface AttendanceListCache {
  data: AttendanceRecord[];
  meta?: unknown;
}

/** Params object stored as the third segment of the list query key. */
function keyParams(key: QueryKey): ListAttendanceParams | undefined {
  return key[2] as ListAttendanceParams | undefined;
}

/**
 * Write a freshly-returned record into every matching list cache — the row
 * flips instantly instead of waiting on (or being dropped by) the refetch.
 */
function upsertRecord(
  queryClient: ReturnType<typeof useQueryClient>,
  record: AttendanceRecord
) {
  for (const [key, old] of queryClient.getQueriesData<AttendanceListCache>({
    queryKey: ATTENDANCE_LIST_KEY,
  })) {
    const params = keyParams(key);
    if (!old) continue;
    // Only write into caches this record belongs to.
    if (params?.eventId && params.eventId !== record.eventId) continue;
    if (params?.studentId && params.studentId !== record.studentId) continue;

    const exists = old.data.some((r) => r.id === record.id);
    queryClient.setQueryData<AttendanceListCache>(key, {
      ...old,
      data: exists
        ? old.data.map((r) => (r.id === record.id ? record : r))
        : [record, ...old.data],
    });
  }
}

export function useMarkAttendance(onSuccess?: () => void) {
  const queryClient = useQueryClient();
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
    onSuccess: (result) => {
      upsertRecord(queryClient, result.attendance);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_LIST_KEY });
      onSuccess?.();
    },
  });
}

export function useUpdateAttendance(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AttendanceStatus }) =>
      updateAttendanceAction(id, status),
    onSuccess: (result) => {
      upsertRecord(queryClient, result.attendance);
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_LIST_KEY });
      onSuccess?.();
    },
  });
}

export function useDeleteAttendance(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttendanceAction(id),
    onSuccess: (_result, id) => {
      for (const [key, old] of queryClient.getQueriesData<AttendanceListCache>({
        queryKey: ATTENDANCE_LIST_KEY,
      })) {
        if (!old) continue;
        queryClient.setQueryData<AttendanceListCache>(key, {
          ...old,
          data: old.data.filter((r) => r.id !== id),
        });
      }
      queryClient.invalidateQueries({ queryKey: ATTENDANCE_LIST_KEY });
      onSuccess?.();
    },
  });
}
