import mongoose from "mongoose";
import Club from "./club.model";
import ClubMembership from "../club-membership/club-membership.model";
import Event from "../event/event.model";
import User from "../auth/user.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateClubBody,
  UpdateClubBody,
  ListClubsQuery,
} from "./club.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanClub {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  department: string;
  logoUrl?: string;
  facultyCoordinatorId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanClub) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    department: doc.department,
    logoUrl: doc.logoUrl,
    facultyCoordinatorId: doc.facultyCoordinatorId.toString(),
    isActive: doc.isActive,
    createdBy: doc.createdBy.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function assertFacultyCoordinator(userId: string): Promise<void> {
  const user = await User.findById(userId).select("isActive").lean();
  if (!user || !user.isActive) {
    throw new ApiError(
      400,
      "INVALID_FACULTY_COORDINATOR",
      "facultyCoordinatorId must reference an active user"
    );
  }
}

/** True when the user is the faculty coordinator of the given club. */
export function isClubFaculty(
  club: { facultyCoordinatorId: mongoose.Types.ObjectId },
  userId: string
): boolean {
  return club.facultyCoordinatorId.toString() === userId;
}

/** Clubs the user actively belongs to. */
async function memberClubIds(userId: string) {
  const memberships = await ClubMembership.find({
    studentId: userId,
    status: "ACTIVE",
  })
    .select("clubId")
    .lean();
  return memberships.map((m) => m.clubId);
}

/**
 * Read scope for non-admins: clubs they coordinate, created, or actively
 * belong to. Everything else is invisible.
 */
async function visibleClubFilter(userId: string) {
  const memberOf = await memberClubIds(userId);
  const uid = new mongoose.Types.ObjectId(userId);
  return {
    $or: [
      { facultyCoordinatorId: uid },
      { createdBy: uid },
      { _id: { $in: memberOf } },
    ],
  };
}

/** Read check for a single club — same scope as visibleClubFilter. */
async function assertClubVisible(
  club: {
    _id: mongoose.Types.ObjectId;
    facultyCoordinatorId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
  },
  userId: string,
  isSuperAdmin: boolean
): Promise<void> {
  if (isSuperAdmin) return;
  if (
    club.facultyCoordinatorId.toString() === userId ||
    club.createdBy.toString() === userId
  ) {
    return;
  }
  const memberOf = await memberClubIds(userId);
  if (memberOf.some((c) => c.toString() === club._id.toString())) return;
  // 404 not 403 — don't leak the club's existence.
  throw new ApiError(404, "CLUB_NOT_FOUND", "Club not found");
}

// ── createClub ────────────────────────────────────────────────────────────────

export async function createClub(input: CreateClubBody, createdBy: string) {
  const taken = await Club.exists({
    name: { $regex: `^${escapeRegex(input.name)}$`, $options: "i" },
  });
  if (taken) {
    throw new ApiError(
      409,
      "CLUB_NAME_IN_USE",
      "A club with this name already exists"
    );
  }

  await assertFacultyCoordinator(input.facultyCoordinatorId);

  const club = await Club.create({
    name: input.name,
    description: input.description ?? "",
    department: input.department,
    logoUrl: input.logoUrl,
    facultyCoordinatorId: input.facultyCoordinatorId,
    // New clubs start inactive — a SUPER_ADMIN must approve them before
    // they become active.
    isActive: false,
    createdBy,
  });

  return toResponse(club.toObject() as LeanClub);
}

// ── listClubs ─────────────────────────────────────────────────────────────────

export async function listClubs(
  query: ListClubsQuery,
  userId: string,
  isSuperAdmin: boolean
) {
  const { page, limit, search, department, isActive } = query;

  const filter: Record<string, unknown> = {};
  if (!isSuperAdmin) {
    Object.assign(filter, await visibleClubFilter(userId));
  }
  if (isActive !== undefined) filter.isActive = isActive;
  if (department) {
    filter.department = { $regex: `^${escapeRegex(department)}$`, $options: "i" };
  }
  if (search) {
    const safe = escapeRegex(search);
    filter.name = { $regex: safe, $options: "i" };
  }

  const [total, docs] = await Promise.all([
    Club.countDocuments(filter),
    Club.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanClub[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getClubById ───────────────────────────────────────────────────────────────

export async function getClubById(
  id: string,
  userId: string,
  isSuperAdmin: boolean
) {
  const doc = await Club.findById(id).lean();
  if (!doc) {
    throw new ApiError(404, "CLUB_NOT_FOUND", "Club not found");
  }
  await assertClubVisible(
    doc as unknown as Parameters<typeof assertClubVisible>[0],
    userId,
    isSuperAdmin
  );
  return toResponse(doc as unknown as LeanClub);
}

// ── updateClub ────────────────────────────────────────────────────────────────

export async function updateClub(
  id: string,
  input: UpdateClubBody,
  userId: string,
  isSuperAdmin: boolean
) {
  const existing = await Club.findById(id);
  if (!existing) {
    throw new ApiError(404, "CLUB_NOT_FOUND", "Club not found");
  }

  // Only the club's own faculty coordinator (or a super admin) may edit it.
  if (!isSuperAdmin && !isClubFaculty(existing, userId)) {
    throw new ApiError(
      403,
      "NOT_CLUB_FACULTY",
      "Only the club's faculty coordinator can edit it"
    );
  }

  // Activation status is controlled through the approval flow — only a
  // SUPER_ADMIN may toggle it (directly or via PATCH /:id/approve).
  if (input.isActive !== undefined && !isSuperAdmin) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only a super admin can change a club's active status"
    );
  }

  if (input.name && input.name !== existing.name) {
    const taken = await Club.exists({
      name: { $regex: `^${escapeRegex(input.name)}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (taken) {
      throw new ApiError(
        409,
        "CLUB_NAME_IN_USE",
        "A club with this name already exists"
      );
    }
  }

  if (input.facultyCoordinatorId) {
    await assertFacultyCoordinator(input.facultyCoordinatorId);
  }

  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (input.department !== undefined) set.department = input.department;
  if (input.logoUrl === null) unset.logoUrl = 1;
  else if (input.logoUrl !== undefined) set.logoUrl = input.logoUrl;
  if (input.facultyCoordinatorId !== undefined) {
    set.facultyCoordinatorId = input.facultyCoordinatorId;
  }
  if (input.isActive !== undefined) set.isActive = input.isActive;

  const doc = await Club.findByIdAndUpdate(
    id,
    { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) },
    { new: true, runValidators: true }
  ).lean();

  return toResponse(doc as unknown as LeanClub);
}

// ── approveClub ───────────────────────────────────────────────────────────────

export async function approveClub(id: string) {
  const existing = await Club.findById(id);
  if (!existing) {
    throw new ApiError(404, "CLUB_NOT_FOUND", "Club not found");
  }
  if (existing.isActive) {
    throw new ApiError(409, "CLUB_ALREADY_ACTIVE", "Club is already active");
  }

  existing.isActive = true;
  await existing.save();

  return toResponse(existing.toObject() as LeanClub);
}

// ── deleteClub ────────────────────────────────────────────────────────────────

export async function deleteClub(
  id: string,
  userId: string,
  isSuperAdmin: boolean
) {
  const club = await Club.findById(id);
  if (!club) {
    throw new ApiError(404, "CLUB_NOT_FOUND", "Club not found");
  }

  // Only the club's own faculty coordinator (or a super admin) may delete it.
  if (!isSuperAdmin && !isClubFaculty(club, userId)) {
    throw new ApiError(
      403,
      "NOT_CLUB_FACULTY",
      "Only the club's faculty coordinator can delete it"
    );
  }

  const [memberships, events] = await Promise.all([
    ClubMembership.exists({ clubId: id }),
    Event.exists({ clubId: id }),
  ]);

  if (memberships || events) {
    throw new ApiError(
      409,
      "CLUB_IN_USE",
      "Club has memberships or events — deactivate it instead"
    );
  }

  await club.deleteOne();
}
