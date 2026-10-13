import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createStudentSchema,
  updateStudentSchema,
  updateStudentStatusSchema,
  listStudentsQuerySchema,
  studentIdParamSchema,
} from "./student.validation";
import * as StudentService from "./student.service";

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
  const parsed = studentIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid student id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/students
export async function createStudent(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const student = await StudentService.createStudent(parsed.data);
  res.status(201).json({ success: true, data: { student } });
}

// GET /api/v1/students
export async function listStudents(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listStudentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await StudentService.listStudents(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/students/:id
export async function getStudent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const student = await StudentService.getStudentById(id);
  res.status(200).json({ success: true, data: { student } });
}

// PATCH /api/v1/students/:id
export async function updateStudent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateStudentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const student = await StudentService.updateStudent(id, parsed.data);
  res.status(200).json({ success: true, data: { student } });
}

// PATCH /api/v1/students/:id/status
export async function updateStudentStatus(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateStudentStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const student = await StudentService.updateStudentStatus(id, parsed.data);
  res.status(200).json({ success: true, data: { student } });
}
