import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import User, { IUser } from "../auth/user.model";
import Role from "../role/role.model";
import { ApiError } from "../../lib/ApiError";
import { sendTempPasswordEmail } from "../../lib/mailer";
import type {
  CreateUserBody,
  UpdateUserBody,
  ListUsersQuery,
} from "./users.validation";

// ── Response shape ────────────────────────────────────────────────────────────

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId?.toString(),
    image: user.image,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 16 url-safe chars — satisfies the min-10 policy and is email-friendly. */
function generateTempPassword(): string {
  return randomBytes(12).toString("base64url");
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

  // When no password is supplied, generate a secure random one — it is emailed
  // to the user and must be changed on first login.
  const tempPassword = input.password ?? generateTempPassword();

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash: await bcrypt.hash(tempPassword, 12),
    // The stored role name mirrors the Role document — roleId is the
    // authoritative link used to resolve permissions.
    role: role.name,
    roleId: new mongoose.Types.ObjectId(input.roleId),
    image: input.image,
    mustChangePassword: true,
    isActive: true,
  });

  const emailSent = await sendTempPasswordEmail({
    to: user.email,
    name: user.name,
    password: tempPassword,
  }).catch(() => false);

  return { user: safeUser(user), emailSent };
}

// ── listUsers ─────────────────────────────────────────────────────────────────

export async function listUsers(query: ListUsersQuery, currentUser?: IUser) {
  const { search, page, limit } = query;

  const filter: Record<string, unknown> = {};

  // SUPER_ADMIN details are never shown to custom-role users
  if (currentUser?.role !== "SUPER_ADMIN") {
    filter.role = { $ne: "SUPER_ADMIN" };
  }

  if (search) {
    const safe = escapeRegex(search);
    const searchCondition = [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
    if (filter.role) {
      filter.$and = [{ role: filter.role }, { $or: searchCondition }];
      delete filter.role;
    } else {
      filter.$or = searchCondition;
    }
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

// ── getUserById ───────────────────────────────────────────────────────────────

export async function getUserById(id: string, currentUser?: IUser) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Non-super admins cannot view super admin details
  if (user.role === "SUPER_ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  return safeUser(user);
}

// ── updateUser ────────────────────────────────────────────────────────────────

export async function updateUser(
  id: string,
  input: UpdateUserBody,
  currentUser?: IUser
) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Non-super admins cannot edit or view super admin details
  if (user.role === "SUPER_ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  // Prevent demoting the hardcoded system account
  if (user.role === "SUPER_ADMIN" && input.roleId) {
    throw new ApiError(
      400,
      "SUPER_ADMIN_ROLE_LOCKED",
      "The SUPER_ADMIN role cannot be changed"
    );
  }

  // Check email uniqueness if email is changed
  if (input.email && input.email !== user.email) {
    const taken = await User.exists({
      email: input.email,
      _id: { $ne: id },
    });
    if (taken) {
      throw new ApiError(
        409,
        "EMAIL_IN_USE",
        "A user with this email already exists"
      );
    }
    user.email = input.email;
  }

  if (input.name) {
    user.name = input.name;
  }

  if (input.roleId) {
    const role = await Role.findById(input.roleId).lean();
    if (!role || !role.isActive) {
      throw new ApiError(
        400,
        "INVALID_ROLE",
        "roleId must reference an active role"
      );
    }
    user.roleId = new mongoose.Types.ObjectId(input.roleId);
    user.role = role.name;
  }

  if (input.password) {
    user.passwordHash = await bcrypt.hash(input.password, 12);
    user.mustChangePassword = true;
  }

  if (input.image !== undefined) {
    user.image = input.image === null ? undefined : input.image;
  }

  if (input.isActive !== undefined) {
    user.isActive = input.isActive;
  }

  await user.save();
  return safeUser(user);
}

// ── deleteUser ────────────────────────────────────────────────────────────────

export async function deleteUser(id: string, currentUser?: IUser) {
  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }

  if (user.role === "SUPER_ADMIN") {
    throw new ApiError(
      400,
      "SUPER_ADMIN_PROTECTED",
      "SUPER_ADMIN account cannot be deleted"
    );
  }

  await user.deleteOne();
}
