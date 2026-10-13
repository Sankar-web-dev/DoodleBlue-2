import mongoose from "mongoose";
import Role, { IRole, IPermission } from "./role.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateRoleBody,
  UpdateRoleBody,
  ListRolesQuery,
} from "./role.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanRole {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  permissions: IPermission[];
  isSystem: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanRole) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    permissions: doc.permissions,
    isSystem: doc.isSystem,
    isActive: doc.isActive,
    createdBy: doc.createdBy?.toString(),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ── createRole ────────────────────────────────────────────────────────────────

export async function createRole(
  input: CreateRoleBody,
  createdBy: string
) {
  const taken = await Role.exists({
    name: { $regex: `^${escapeRegex(input.name)}$`, $options: "i" },
  });
  if (taken) {
    throw new ApiError(
      409,
      "ROLE_NAME_IN_USE",
      "A role with this name already exists"
    );
  }

  const role = await Role.create({
    name: input.name,
    description: input.description ?? "",
    permissions: input.permissions,
    isSystem: false,
    isActive: true,
    createdBy,
  });

  return toResponse(role.toObject() as LeanRole);
}

// ── listRoles ─────────────────────────────────────────────────────────────────

export async function listRoles(query: ListRolesQuery) {
  const { page, limit, search, isActive } = query;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const safe = escapeRegex(search);
    filter.name = { $regex: safe, $options: "i" };
  }

  const [total, docs] = await Promise.all([
    Role.countDocuments(filter),
    Role.find(filter)
      .sort({ isSystem: -1, createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanRole[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getRoleById ───────────────────────────────────────────────────────────────

export async function getRoleById(id: string) {
  const doc = await Role.findById(id).lean();
  if (!doc) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }
  return toResponse(doc as unknown as LeanRole);
}

// ── updateRole ────────────────────────────────────────────────────────────────

export async function updateRole(id: string, input: UpdateRoleBody) {
  const existing = await Role.findById(id);
  if (!existing) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }

  // System roles can have their permissions updated, but their name cannot
  // be changed (the name is used as a stable identifier by seed scripts and
  // student creation).
  if (existing.isSystem && input.name && input.name !== existing.name) {
    throw new ApiError(
      400,
      "SYSTEM_ROLE_NAME_LOCKED",
      "The name of a system role cannot be changed"
    );
  }

  // Check uniqueness if name is being changed.
  if (input.name && input.name !== existing.name) {
    const taken = await Role.exists({
      name: { $regex: `^${escapeRegex(input.name)}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (taken) {
      throw new ApiError(
        409,
        "ROLE_NAME_IN_USE",
        "A role with this name already exists"
      );
    }
  }

  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (input.permissions !== undefined) set.permissions = input.permissions;
  if (input.isActive !== undefined) set.isActive = input.isActive;

  const doc = await Role.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  ).lean();

  return toResponse(doc as unknown as LeanRole);
}

// ── deleteRole ────────────────────────────────────────────────────────────────

export async function deleteRole(id: string) {
  const role = await Role.findById(id);
  if (!role) {
    throw new ApiError(404, "ROLE_NOT_FOUND", "Role not found");
  }
  if (role.isSystem) {
    throw new ApiError(
      400,
      "SYSTEM_ROLE_PROTECTED",
      "System roles cannot be deleted"
    );
  }
  await role.deleteOne();
}
