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
 * Membership rows are stored as raw ObjectIds — this joins them with the
 * clubs/users lookups so tables and sheets can display real names.
 */
export interface MembershipRow extends ClubMembership {
  clubName: string;
  clubDepartment: string;
  studentName: string;
  studentEmail: string;
  assignedByName: string;
}

export function useMembershipRows() {
  const membershipsQuery = useMemberships();
  const clubsQuery = useClubs();
  const usersQuery = useUsers();

  const rows = useMemo<MembershipRow[]>(() => {
    const clubById = new Map(
      (clubsQuery.data?.data ?? []).map((c) => [c.id, c])
    );
    const userById = new Map(
      (usersQuery.data?.data.users ?? []).map((u) => [u.id, u])
    );

    return (membershipsQuery.data?.data ?? []).map((m) => {
      const club = clubById.get(m.clubId);
      const student = userById.get(m.studentId);
      return {
        ...m,
        clubName: club?.name ?? "Unknown club",
        clubDepartment: club?.department ?? "",
        studentName: student?.name ?? "Unknown user",
        studentEmail: student?.email ?? "",
        assignedByName: userById.get(m.assignedBy)?.name ?? "—",
      };
    });
  }, [membershipsQuery.data, clubsQuery.data, usersQuery.data]);

  return {
    data: rows,
    isPending:
      membershipsQuery.isPending ||
      clubsQuery.isPending ||
      usersQuery.isPending,
    error:
      membershipsQuery.error ?? clubsQuery.error ?? usersQuery.error ?? null,
    refetch: () => {
      membershipsQuery.refetch();
      clubsQuery.refetch();
      usersQuery.refetch();
    },
  };
}
