import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clubsApi, CLUBS_LIST_KEY } from "@/api/clubs.api";

export function useClubs() {
  return useQuery({
    queryKey: CLUBS_LIST_KEY,
    queryFn: () => clubsApi.listClubs({ limit: 100 }),
  });
}

export function useClub(id: string) {
  return useQuery({
    queryKey: ["clubs", "detail", id],
    queryFn: () => clubsApi.getClub(id),
    enabled: !!id,
  });
}

export function useApproveClub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clubsApi.approveClub(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: CLUBS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["clubs", "detail", id] });
    },
  });
}

export function useDeleteClub(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clubsApi.deleteClub(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_LIST_KEY });
      onSuccess?.();
    },
  });
}
