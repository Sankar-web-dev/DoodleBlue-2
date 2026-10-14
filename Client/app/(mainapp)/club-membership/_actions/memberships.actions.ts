import {
  clubMembershipsApi,
  type MembershipRole,
  type MembershipStatus,
} from "@/api/club-memberships.api";
import { usersApi } from "@/api/users.api";

/**
 * Create flow: provision a user account first (no password — the server
 * generates one and emails it), then attach them to the club as a plain
 * member. Coordinator promotion happens via Edit.
 */
export async function createMemberWithAccountAction(input: {
  clubId: string;
  name: string;
  email: string;
  roleId: string;
}) {
  const { user, emailSent } = await usersApi.createUser({
    name: input.name,
    email: input.email,
    roleId: input.roleId,
  });
  const result = await clubMembershipsApi.createMembership({
    clubId: input.clubId,
    studentId: user.id,
    membershipRole: "MEMBER",
  });
  return { membership: result.membership, emailSent };
}

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

/** SUPER_ADMIN only — approve a pending membership. */
export async function approveMembershipAction(id: string) {
  return clubMembershipsApi.approveMembership(id);
}

export async function deleteMembershipAction(id: string) {
  return clubMembershipsApi.deleteMembership(id);
}
