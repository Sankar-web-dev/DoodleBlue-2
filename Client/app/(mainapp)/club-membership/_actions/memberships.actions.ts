import {
  clubMembershipsApi,
  type MembershipRole,
  type MembershipStatus,
} from "@/api/club-memberships.api";
import { usersApi } from "@/api/users.api";

/**
 * Create flow: provision a user account first, then attach them to the club
 * as a plain member. Coordinator promotion happens via Edit.
 */
export async function createMemberWithAccountAction(input: {
  clubId: string;
  name: string;
  email: string;
  password: string;
  roleId: string;
}) {
  const { user } = await usersApi.createUser({
    name: input.name,
    email: input.email,
    password: input.password,
    roleId: input.roleId,
  });
  return clubMembershipsApi.createMembership({
    clubId: input.clubId,
    studentId: user.id,
    membershipRole: "MEMBER",
  });
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

export async function deleteMembershipAction(id: string) {
  return clubMembershipsApi.deleteMembership(id);
}
