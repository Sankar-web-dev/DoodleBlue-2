import { Request, Response } from "express";
import {
  markAttendanceSchema,
  updateAttendanceSchema,
  listAttendanceQuerySchema,
} from "./attendance.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import { hasPermission } from "../auth/auth.middleware";
import * as AttendanceService from "./attendance.service";
import { IUser } from "../auth/user.model";
import { IRole } from "../role/role.model";

// POST /api/v1/attendance
export async function markAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = markAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const attendance = await AttendanceService.markAttendance(
    parsed.data,
    currentUser._id.toString(),
    currentUser.role === "SUPER_ADMIN"
  );
  res.status(201).json({ success: true, data: { attendance } });
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

  const currentUser = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;
  const canManage = hasPermission(
    currentUser,
    role,
    "attendance",
    "update"
  );

  const result = await AttendanceService.listAttendance(
    parsed.data,
    currentUser._id.toString(),
    canManage
  );
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// PATCH /api/v1/attendance/:id
export async function updateAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateAttendanceSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const attendance = await AttendanceService.updateAttendance(
    id,
    parsed.data,
    currentUser._id.toString(),
    currentUser.role === "SUPER_ADMIN"
  );
  res.status(200).json({ success: true, data: { attendance } });
}

// DELETE /api/v1/attendance/:id
export async function deleteAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await AttendanceService.deleteAttendance(id);
  res.status(200).json({
    success: true,
    data: { message: "Attendance record deleted" },
  });
}
