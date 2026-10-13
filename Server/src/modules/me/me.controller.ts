import { Request, Response } from "express";
import { ZodError } from "zod";
import { IUser } from "../auth/user.model";
import {
  myEnrollmentsQuerySchema,
  myAttendanceQuerySchema,
} from "./me.validation";
import * as MeService from "./me.service";

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

// GET /api/v1/me/profile
export async function getMyProfile(
  _req: Request,
  res: Response
): Promise<void> {
  const user = res.locals.currentUser as IUser;
  const profile = await MeService.getMyProfile(user);
  res.status(200).json({ success: true, data: { student: profile } });
}

// GET /api/v1/me/enrollments
export async function getMyEnrollments(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = myEnrollmentsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.currentUser as IUser;
  const result = await MeService.getMyEnrollments(user, parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/me/attendance
export async function getMyAttendance(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = myAttendanceQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const user = res.locals.currentUser as IUser;
  const result = await MeService.getMyAttendance(user, parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}
