import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User, { IUser } from "../auth/user.model";
import Role from "../role/role.model";
import { ApiError } from "../../lib/ApiError";
import type { CreateUserBody, ListUsersQuery } from "./users.validation";

// ── Response shape ────────────────────────────────────────────────────────────

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId?.toString(),
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── createUser ────────────────────────────────────────────────────────────────

export async function createUser(input: CreateUserBody) {
  const role = await Role.findById(input.roleId).lean();
  if (!role || !role.isActive) {
    throw new ApiError(
      400,
      "INVALID_ROLE",
      "roleId must reference an active role"
    );
  }

  const taken = await User.exists({ email: input.email });
  if (taken) {
    throw new ApiError(
      409,
      "EMAIL_IN_USE",
      "A user with this email already exists"
    );
  }

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(input.password, 12),
    // The stored role name mirrors the Role document — roleId is the
    // authoritative link used to resolve permissions.
    role: role.name,
    roleId: new mongoose.Types.ObjectId(input.roleId),
    mustChangePassword: true,
    isActive: true,
  });

  return safeUser(user);
}

// ── listUsers ─────────────────────────────────────────────────────────────────

export async function listUsers(query: ListUsersQuery) {
  const { search, page, limit } = query;

  const filter: Record<string, unknown> = {};
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
      .limit(limit),
  ]);

  return {
    data: docs.map(safeUser),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
