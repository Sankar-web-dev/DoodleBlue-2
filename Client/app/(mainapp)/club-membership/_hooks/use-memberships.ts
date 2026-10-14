import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  clubMembershipsApi,
  MEMBERSHIPS_LIST_KEY,
  type ClubMembership,
} from "@/api/club-memberships.api";
import { clubsApi, CLUBS_LIST_KEY } from "@/api/clubs.api";
import { usersApi, USERS_LIST_KEY } from "@/api/users.api";

export function useMemberships() {
  return useQuery({
    queryKey: MEMBERSHIPS_LIST_KEY,
    queryFn: () => clubMembershipsApi.listMemberships({ limit: 100 }),
  });
}

export function useMembership(id: string) {
  return useQuery({
    queryKey: ["club-memberships", "detail", id],
    queryFn: () => clubMembershipsApi.getMembership(id),
    enabled: !!id,
  });
}

export function useDeleteMembership(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clubMembershipsApi.deleteMembership(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_LIST_KEY });
      onSuccess?.();
    },
  });
}

export function useClubs() {
  return useQuery({
    queryKey: CLUBS_LIST_KEY,
    queryFn: () => clubsApi.listClubs({ limit: 100 }),
  });
}

export function useUsers() {
  return useQuery({
    queryKey: USERS_LIST_KEY,
    queryFn: () => usersApi.listUsers({ limit: 100 }),
  });
}

/**
 * Membership row with display-ready names — resolved from the server's
 * populated `club`/`student`/`assignedByUser` objects.
 */
export interface MembershipRow extends ClubMembership {
  clubName: string;
  clubDepartment: string;
  studentName: string;
  studentEmail: string;
  assignedByName: string;
}

/**
 * The server populates club/student/assigner names on every membership
 * response — no extra clubs/users lookups are needed (those endpoints require
 * separate permissions that member-level roles don't have).
 */
export function useMembershipRows() {
  const membershipsQuery = useMemberships();

  const rows = useMemo<MembershipRow[]>(
    () =>
      (membershipsQuery.data?.data ?? []).map((m) => ({
        ...m,
        clubName: m.club?.name ?? "Unknown club",
        clubDepartment: m.club?.department ?? "",
        studentName: m.student?.name ?? "Unknown user",
        studentEmail: m.student?.email ?? "",
        assignedByName: m.assignedByUser?.name ?? "—",
      })),
    [membershipsQuery.data]
  );

  return {
    data: rows,
    isPending: membershipsQuery.isPending,
    error: membershipsQuery.error ?? null,
    refetch: membershipsQuery.refetch,
  };
}
