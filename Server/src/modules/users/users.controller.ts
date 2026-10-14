import { Request, Response } from "express";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from "./users.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import { hasPermission } from "../auth/auth.middleware";
import * as UsersService from "./users.service";
import { IUser } from "../auth/user.model";
import { IRole } from "../role/role.model";

// POST /api/v1/users — provision a user account with a role
export async function createUser(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = await UsersService.createUser(parsed.data);
  res.status(201).json({ success: true, data: { user } });
}

// GET /api/v1/users — list accounts (filterable by search)
export async function listUsers(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listUsersQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser;
  const result = await UsersService.listUsers(parsed.data, currentUser);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/users/options — lightweight picker list for forms.
// Available to anyone who can read users OR manage clubs/memberships —
// a faculty creating a club shouldn't need full users:read.
export async function listUserOptions(
  req: Request,
  res: Response
): Promise<void> {
  const currentUser = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;

  const allowed =
    hasPermission(currentUser, role, "users", "read") ||
    hasPermission(currentUser, role, "clubs", "create") ||
    hasPermission(currentUser, role, "clubs", "update") ||
    hasPermission(currentUser, role, "clubMemberships", "create");

  if (!allowed) {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "You do not have permission to list user options",
      },
    });
    return;
  }

  const users = await UsersService.listUserOptions(currentUser);
  res.status(200).json({ success: true, data: users });
}

// GET /api/v1/users/:id — retrieve single user
export async function getUser(req: Request, res: Response): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser;
  const user = await UsersService.getUserById(id, currentUser);
  res.status(200).json({ success: true, data: { user } });
}

// PATCH /api/v1/users/:id — update user details, role, or active status
export async function updateUser(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser;
  const user = await UsersService.updateUser(id, parsed.data, currentUser);
  res.status(200).json({ success: true, data: { user } });
}

// DELETE /api/v1/users/:id — remove a user account
export async function deleteUser(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser;
  await UsersService.deleteUser(id, currentUser);
  res.status(200).json({ success: true, message: "User deleted successfully" });
}
