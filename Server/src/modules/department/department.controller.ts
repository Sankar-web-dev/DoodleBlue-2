import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsQuerySchema,
  departmentIdParamSchema,
} from "./department.validation";
import * as DepartmentService from "./department.service";

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
  const parsed = departmentIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid department id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/departments
export async function createDepartment(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createDepartmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const department = await DepartmentService.createDepartment(parsed.data);
  res.status(201).json({ success: true, data: { department } });
}

// GET /api/v1/departments
export async function listDepartments(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listDepartmentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await DepartmentService.listDepartments(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/departments/:id
export async function getDepartment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const department = await DepartmentService.getDepartmentById(id);
  res.status(200).json({ success: true, data: { department } });
}

// PATCH /api/v1/departments/:id
export async function updateDepartment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateDepartmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const department = await DepartmentService.updateDepartment(
    id,
    parsed.data
  );
  res.status(200).json({ success: true, data: { department } });
}

// DELETE /api/v1/departments/:id
export async function deleteDepartment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  await DepartmentService.deleteDepartment(id);
  res
    .status(200)
    .json({ success: true, data: { message: "Department deleted" } });
}
