import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createAdminSchema,
  updateAdminSchema,
  listAdminsQuerySchema,
  adminIdParamSchema,
} from "./admin.validation";
import * as AdminService from "./admin.service";

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

/** Returns the validated :id param or sends a 400 and returns null. */
function parseId(req: Request, res: Response): string | null {
  const parsed = adminIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid admin id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/admins
export async function createAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const admin = await AdminService.createAdmin(parsed.data);
  res.status(201).json({ success: true, data: { admin } });
}

// GET /api/v1/admins
export async function listAdmins(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listAdminsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await AdminService.listAdmins(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/admins/:id
export async function getAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const admin = await AdminService.getAdminById(id);
  res.status(200).json({ success: true, data: { admin } });
}

// PATCH /api/v1/admins/:id
export async function updateAdmin(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const admin = await AdminService.updateAdmin(id, parsed.data);
  res.status(200).json({ success: true, data: { admin } });
}
