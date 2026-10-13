import { Request, Response } from "express";
import { ZodError } from "zod";
import { IUser } from "../auth/user.model";
import {
  createAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceQuerySchema,
  attendanceIdParamSchema,
} from "./attendance.validation";
import * as AttendanceService from "./attendance.service";

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
  const parsed = attendanceIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid attendance id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/attendance
export async function recordAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  // recordedBy always comes from the authenticated session — never the body.
  const currentUser = res.locals.currentUser as IUser;
  const record = await AttendanceService.recordAttendance(
    parsed.data,
    currentUser._id
  );
  res.status(201).json({ success: true, data: { attendance: record } });
}

// GET /api/v1/attendance
export async function listAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listAttendanceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await AttendanceService.listAttendance(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/attendance/:id
export async function getAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const record = await AttendanceService.getAttendanceById(id);
  res.status(200).json({ success: true, data: { attendance: record } });
}

// PATCH /api/v1/attendance/:id
export async function updateAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const record = await AttendanceService.updateAttendance(id, parsed.data);
  res.status(200).json({ success: true, data: { attendance: record } });
}

// DELETE /api/v1/attendance/:id
export async function deleteAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  await AttendanceService.deleteAttendance(id);
  res
    .status(200)
    .json({ success: true, data: { message: "Attendance record deleted" } });
}
