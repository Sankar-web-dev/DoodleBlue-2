import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  listEnrollmentsQuerySchema,
  enrollmentIdParamSchema,
} from "./enrollment.validation";
import * as EnrollmentService from "./enrollment.service";

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
  const parsed = enrollmentIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid enrollment id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/enrollments
export async function enrollStudent(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const enrollment = await EnrollmentService.enrollStudent(parsed.data);
  res.status(201).json({ success: true, data: { enrollment } });
}

// GET /api/v1/enrollments
export async function listEnrollments(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listEnrollmentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await EnrollmentService.listEnrollments(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/enrollments/:id
export async function getEnrollment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const enrollment = await EnrollmentService.getEnrollmentById(id);
  res.status(200).json({ success: true, data: { enrollment } });
}

// PATCH /api/v1/enrollments/:id
export async function updateEnrollment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateEnrollmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const enrollment = await EnrollmentService.updateEnrollmentStatus(
    id,
    parsed.data
  );
  res.status(200).json({ success: true, data: { enrollment } });
}

// DELETE /api/v1/enrollments/:id
export async function deleteEnrollment(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  await EnrollmentService.deleteEnrollment(id);
  res
    .status(200)
    .json({ success: true, data: { message: "Enrollment deleted" } });
}
