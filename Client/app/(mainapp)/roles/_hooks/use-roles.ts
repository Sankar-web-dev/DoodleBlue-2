import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rolesApi, ROLES_LIST_KEY } from "@/api/roles.api";

export function useRoles() {
  return useQuery({
    queryKey: ROLES_LIST_KEY,
    queryFn: () => rolesApi.listRoles({ limit: 100 }),
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: ["roles", "detail", id],
    queryFn: () => rolesApi.getRole(id),
    enabled: !!id,
  });
}

export function useDeleteRole(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROLES_LIST_KEY });
      onSuccess?.();
    },
  });
}
