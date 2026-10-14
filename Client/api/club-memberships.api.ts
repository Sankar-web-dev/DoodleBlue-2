import { api, PaginationMeta } from "@/lib/api";

export type MembershipRole = "MEMBER" | "COORDINATOR";
export type MembershipStatus = "ACTIVE" | "INACTIVE";

export interface ClubMembership {
  id: string;
  clubId: string;
  studentId: string;
  membershipRole: MembershipRole;
  status: MembershipStatus;
  assignedBy: string;
  assignedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipInput {
  clubId: string;
  studentId: string;
  membershipRole?: MembershipRole;
}

export interface UpdateMembershipInput {
  membershipRole?: MembershipRole;
  status?: MembershipStatus;
}

export interface ListMembershipsParams {
  clubId?: string;
  studentId?: string;
  membershipRole?: MembershipRole;
  status?: MembershipStatus;
  page?: number;
  limit?: number;
}

export const clubMembershipsApi = {
  createMembership: (input: CreateMembershipInput) =>
    api.post<{ membership: ClubMembership }>("/api/v1/club-memberships", input),

  updateMembership: (id: string, input: UpdateMembershipInput) =>
    api.patch<{ membership: ClubMembership }>(
      `/api/v1/club-memberships/${id}`,
      input
    ),

  deleteMembership: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/club-memberships/${id}`),

  getMembership: (id: string) =>
    api.get<{ membership: ClubMembership }>(`/api/v1/club-memberships/${id}`),

  listMemberships: (params: ListMembershipsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.clubId) qs.set("clubId", params.clubId);
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.membershipRole) qs.set("membershipRole", params.membershipRole);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<ClubMembership[], PaginationMeta>(
      `/api/v1/club-memberships${query ? `?${query}` : ""}`
    );
  },
};

export const clubMembershipsService = clubMembershipsApi;
export const MEMBERSHIPS_LIST_KEY = ["club-memberships", "list"] as const;
