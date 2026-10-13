import { Request, Response } from "express";
import { createUserSchema, listUsersQuerySchema } from "./users.validation";
import { sendValidationError } from "../../lib/validation";
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

  const result = await UsersService.listUsers(parsed.data);
  res.status(200).json({
    success: true,
    data: { users: result.data },
    meta: result.meta,
  });
}
