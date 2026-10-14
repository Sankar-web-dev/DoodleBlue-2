import { Request, Response } from "express";
import {
  createUserSchema,
  updateUserSchema,
  listUsersQuerySchema,
} from "./users.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import * as UsersService from "./users.service";

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

  const { user, emailSent } = await UsersService.createUser(parsed.data);
  res.status(201).json({ success: true, data: { user, emailSent } });
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
