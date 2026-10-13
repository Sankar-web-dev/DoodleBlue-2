import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createRoleSchema,
  updateRoleSchema,
  listRolesQuerySchema,
  roleIdParamSchema,
} from "./role.validation";
import * as RoleService from "./role.service";
import { IUser } from "../auth/user.model";

function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    },
  });
}

function parseId(req: Request, res: Response): string | null {
  const parsed = roleIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid role id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/roles
export async function createRole(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const role = await RoleService.createRole(parsed.data, currentUser._id.toString());
  res.status(201).json({ success: true, data: { role } });
}

// GET /api/v1/roles
export async function listRoles(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listRolesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await RoleService.listRoles(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/roles/:id
export async function getRole(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const role = await RoleService.getRoleById(id);
  res.status(200).json({ success: true, data: { role } });
}

// PATCH /api/v1/roles/:id
export async function updateRole(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const role = await RoleService.updateRole(id, parsed.data);
  res.status(200).json({ success: true, data: { role } });
}

// DELETE /api/v1/roles/:id
export async function deleteRole(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  await RoleService.deleteRole(id);
  res.status(200).json({ success: true, data: { message: "Role deleted" } });
}
