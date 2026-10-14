import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, USERS_LIST_KEY, type ListUsersParams } from "@/api/users.api";

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
