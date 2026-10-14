import mongoose from "mongoose";
import ClubMembership, { IClubMembership } from "./club-membership.model";
import Club from "../club/club.model";
import User from "../auth/user.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateMembershipBody,
  UpdateMembershipBody,
  ListMembershipsQuery,
} from "./club-membership.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanMembership {
  _id: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; department: string };
  studentId: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string; email: string };
  membershipRole: string;
  status: string;
  assignedBy: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId; name: string };
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function refId(
  value: LeanMembership["clubId"] | LeanMembership["assignedBy"]
) {
  return value instanceof mongoose.Types.ObjectId
    ? value.toString()
    : value._id.toString();
}

/**
 * Emits flat ids plus populated display objects so clients don't need extra
 * /users or /clubs calls (which require separate permissions).
 */
function toResponse(doc: LeanMembership) {
  const club = typeof doc.clubId === "object" && "name" in doc.clubId
    ? { id: doc.clubId._id.toString(), name: doc.clubId.name, department: doc.clubId.department }
    : undefined;
  const student = typeof doc.studentId === "object" && "name" in doc.studentId
    ? { id: doc.studentId._id.toString(), name: doc.studentId.name, email: doc.studentId.email }
    : undefined;
  const assigner = typeof doc.assignedBy === "object" && "name" in doc.assignedBy
    ? { id: doc.assignedBy._id.toString(), name: doc.assignedBy.name }
    : undefined;

  return {
    id: doc._id.toString(),
    clubId: refId(doc.clubId),
    studentId: refId(doc.studentId),
    club,
    student,
    membershipRole: doc.membershipRole,
    status: doc.status,
    assignedBy: refId(doc.assignedBy),
    assignedByUser: assigner,
    assignedAt: doc.assignedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const MEMBERSHIP_POPULATE = [
  { path: "clubId", select: "name department" },
  { path: "studentId", select: "name email" },
  { path: "assignedBy", select: "name" },
];

// ── Shared lookups (used by event/registration/attendance/certificate services) ─

export async function getActiveMembership(
  clubId: string,
  studentId: string
): Promise<IClubMembership | null> {
  return ClubMembership.findOne({
    clubId,
    studentId,
    status: "ACTIVE",
  }).lean() as Promise<IClubMembership | null>;
}

export async function isActiveMember(
  clubId: string,
  studentId: string
): Promise<boolean> {
  return (await getActiveMembership(clubId, studentId)) !== null;
}

export async function isActiveCoordinator(
  clubId: string,
  userId: string
): Promise<boolean> {
  const doc = await ClubMembership.exists({
    clubId,
    studentId: userId,
    membershipRole: "COORDINATOR",
    status: "ACTIVE",
  });
  return doc !== null;
}

/**
 * Demote the club's current ACTIVE coordinator to MEMBER.
 * At most one exists (partial unique index).
 */
async function demoteCurrentCoordinator(clubId: string): Promise<void> {
  await ClubMembership.findOneAndUpdate(
    { clubId, membershipRole: "COORDINATOR", status: "ACTIVE" },
    { $set: { membershipRole: "MEMBER" } }
  );
}

// ── createMembership ─────────────────────────────────────────────────────────

export async function createMembership(
  input: CreateMembershipBody,
  assignedBy: string
) {
  const [club, student] = await Promise.all([
    Club.findById(input.clubId).select("isActive").lean(),
    User.findById(input.studentId).select("isActive").lean(),
  ]);

  if (!club || !club.isActive) {
    throw new ApiError(400, "INVALID_CLUB", "clubId must reference an active club");
  }
  if (!student || !student.isActive) {
    throw new ApiError(
      400,
      "INVALID_STUDENT",
      "studentId must reference an active user"
    );
  }

  const existing = await ClubMembership.findOne({
    clubId: input.clubId,
    studentId: input.studentId,
  });

  if (existing) {
    throw new ApiError(
      409,
      "MEMBERSHIP_EXISTS",
      "This student is already a member of the club"
    );
  }

  // New memberships start PENDING — a SUPER_ADMIN approves them before they
  // become ACTIVE. A pending coordinator nomination does not demote the
  // incumbent until it is approved.
  const membership = await ClubMembership.create({
    clubId: input.clubId,
    studentId: input.studentId,
    membershipRole: input.membershipRole ?? "MEMBER",
    status: "PENDING",
    assignedBy,
    assignedAt: new Date(),
  });
  await membership.populate(MEMBERSHIP_POPULATE);

  return toResponse(membership.toObject() as LeanMembership);
}

// ── listMemberships ───────────────────────────────────────────────────────────

export async function listMemberships(query: ListMembershipsQuery) {
  const { page, limit, clubId, studentId, membershipRole, status } = query;

  const filter: Record<string, unknown> = {};
  if (clubId) filter.clubId = clubId;
  if (studentId) filter.studentId = studentId;
  if (membershipRole) filter.membershipRole = membershipRole;
  if (status) filter.status = status;

  const [total, docs] = await Promise.all([
    ClubMembership.countDocuments(filter),
    ClubMembership.find(filter)
      .populate(MEMBERSHIP_POPULATE)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanMembership[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getMembershipById ─────────────────────────────────────────────────────────

export async function getMembershipById(id: string) {
  const doc = await ClubMembership.findById(id)
    .populate(MEMBERSHIP_POPULATE)
    .lean();
  if (!doc) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
  }
  return toResponse(doc as unknown as LeanMembership);
}

// ── updateMembership ──────────────────────────────────────────────────────────

export async function updateMembership(
  id: string,
  input: UpdateMembershipBody,
  isSuperAdmin: boolean
) {
  const existing = await ClubMembership.findById(id);
  if (!existing) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
  }

  // Approving or reopening a PENDING membership is a SUPER_ADMIN decision —
  // everyone else may only change member/coordinator roles and toggle
  // ACTIVE ↔ INACTIVE.
  if (
    input.status !== undefined &&
    input.status !== existing.status &&
    (existing.status === "PENDING" || input.status === "PENDING") &&
    !isSuperAdmin
  ) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only a super admin can approve or reopen a pending membership"
    );
  }

  const resultingRole = input.membershipRole ?? existing.membershipRole;
  const resultingStatus = input.status ?? existing.status;

  // A coordinator must end up ACTIVE or PENDING — never INACTIVE.
  if (resultingRole === "COORDINATOR" && resultingStatus === "INACTIVE") {
    throw new ApiError(
      400,
      "COORDINATOR_MUST_BE_ACTIVE",
      "A coordinator must be an active member of the club"
    );
  }

  // Promoting to ACTIVE coordinator demotes the club's incumbent. A PENDING
  // nomination takes effect only when it is approved.
  if (
    resultingRole === "COORDINATOR" &&
    resultingStatus === "ACTIVE" &&
    !(existing.membershipRole === "COORDINATOR" && existing.status === "ACTIVE")
  ) {
    await demoteCurrentCoordinator(existing.clubId.toString());
  }

  const set: Record<string, unknown> = { membershipRole: resultingRole };

  // Deactivating a coordinator also demotes them — a coordinator must be an
  // active member.
  if (resultingStatus === "INACTIVE") {
    set.membershipRole = "MEMBER";
  }
  if (input.status !== undefined) {
    set.status = input.status;
  }

  const doc = await ClubMembership.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  )
    .populate(MEMBERSHIP_POPULATE)
    .lean();

  return toResponse(doc as unknown as LeanMembership);
}

// ── approveMembership — SUPER_ADMIN only (enforced in the controller) ─────────

export async function approveMembership(id: string) {
  const existing = await ClubMembership.findById(id);
  if (!existing) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
  }
  if (existing.status !== "PENDING") {
    throw new ApiError(
      409,
      "MEMBERSHIP_NOT_PENDING",
      "Only pending memberships can be approved"
    );
  }

  // Approving a coordinator nominee demotes the club's incumbent.
  if (existing.membershipRole === "COORDINATOR") {
    await demoteCurrentCoordinator(existing.clubId.toString());
  }

  existing.status = "ACTIVE";
  await existing.save();
  await existing.populate(MEMBERSHIP_POPULATE);

  return toResponse(existing.toObject() as LeanMembership);
}

// ── deleteMembership ──────────────────────────────────────────────────────────

export async function deleteMembership(id: string) {
  const membership = await ClubMembership.findById(id);
  if (!membership) {
    throw new ApiError(404, "MEMBERSHIP_NOT_FOUND", "Membership not found");
  }
  await membership.deleteOne();
}
