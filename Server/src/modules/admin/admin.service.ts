import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../auth/user.model";
import Role from "../role/role.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateAdminBody,
  UpdateAdminBody,
  ListAdminsQuery,
} from "./admin.validation";

const BCRYPT_ROUNDS = 12;

// ─── Lean document shape ──────────────────────────────────────────────────────

interface LeanAdmin {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
  roleId?: mongoose.Types.ObjectId;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe admin payload — passwordHash is never selected or returned. */
function toResponse(doc: LeanAdmin) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
    roleId: doc.roleId?.toString(),
    mustChangePassword: doc.mustChangePassword,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── createAdmin ──────────────────────────────────────────────────────────────

export async function createAdmin(input: CreateAdminBody) {
  const taken = await User.exists({ email: input.email });
  if (taken) {
    throw new ApiError(
      409,
      "EMAIL_IN_USE",
      "A user with this email already exists"
    );
  }

  // Resolve the target role — caller-supplied roleId takes precedence;
  // otherwise we fall back to the system "ADMIN" role.
  const roleDoc = input.roleId
    ? await Role.findById(input.roleId)
    : await Role.findOne({ name: "ADMIN", isSystem: true });

  if (!roleDoc || !roleDoc.isActive) {
    throw new ApiError(400, "ROLE_NOT_FOUND", "The specified role was not found or is inactive");
  }

  const passwordHash = await bcrypt.hash(
    input.temporaryPassword,
    BCRYPT_ROUNDS
  );

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: roleDoc.name,
    roleId: roleDoc._id,
    mustChangePassword: true,
    isActive: true,
  });

  return toResponse(user.toObject() as LeanAdmin);
}

// ─── listAdmins ───────────────────────────────────────────────────────────────

export async function listAdmins(query: ListAdminsQuery) {
  const { page, limit, search, isActive } = query;

  // Exclude SUPER_ADMIN and student accounts — only show non-super, non-student users.
  const filter: Record<string, unknown> = {
    role: { $nin: ["SUPER_ADMIN"] },
    studentId: { $exists: false },
  };
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanAdmin[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getAdminById ─────────────────────────────────────────────────────────────

export async function getAdminById(id: string) {
  const doc = await User.findOne({
    _id: id,
    role: { $ne: "SUPER_ADMIN" },
    studentId: { $exists: false },
  }).lean();
  if (!doc) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin not found");
  }
  return toResponse(doc as unknown as LeanAdmin);
}

// ─── updateAdmin ──────────────────────────────────────────────────────────────

export async function updateAdmin(id: string, input: UpdateAdminBody) {
  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.isActive !== undefined) set.isActive = input.isActive;

  // Scoped to non-SUPER_ADMIN — a SUPER_ADMIN's own record can never be
  // deactivated through this endpoint.
  const doc = await User.findOneAndUpdate(
    { _id: id, role: { $ne: "SUPER_ADMIN" }, studentId: { $exists: false } },
    { $set: set },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) {
    throw new ApiError(404, "ADMIN_NOT_FOUND", "Admin not found");
  }

  return toResponse(doc as unknown as LeanAdmin);
}
