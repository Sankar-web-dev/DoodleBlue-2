import {
  clubMembershipsApi,
  type MembershipRole,
  type MembershipStatus,
} from "@/api/club-memberships.api";

export async function createMembershipAction(
  clubId: string,
  studentId: string,
  membershipRole: MembershipRole
) {
  return clubMembershipsApi.createMembership({
    clubId,
    studentId,
    membershipRole,
  });
}

export async function updateMembershipAction(
  id: string,
  membershipRole: MembershipRole,
  status: MembershipStatus
) {
  return clubMembershipsApi.updateMembership(id, { membershipRole, status });
}

export async function deleteMembershipAction(id: string) {
  return clubMembershipsApi.deleteMembership(id);
}
