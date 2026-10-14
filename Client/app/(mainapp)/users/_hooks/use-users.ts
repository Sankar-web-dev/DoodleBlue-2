import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  usersApi,
  USERS_LIST_KEY,
  USER_OPTIONS_KEY,
  type ListUsersParams,
} from "@/api/users.api";

/** Lightweight picker list — doesn't require the full users:read permission. */
export function useUserOptions() {
  return useQuery({
    queryKey: USER_OPTIONS_KEY,
    queryFn: usersApi.listUserOptions,
    staleTime: 60_000,
  });
}

export function useUsers(params: ListUsersParams = { limit: 100 }) {
  return useQuery({
    queryKey: USERS_LIST_KEY,
    queryFn: () => usersApi.listUsers(params),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ["users", "detail", id],
    queryFn: () => usersApi.getUser(id),
    enabled: !!id,
  });
}

export function useDeleteUser(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      onSuccess?.();
    },
  });
}
