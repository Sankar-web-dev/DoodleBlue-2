import { z } from "zod";
import { ATTENDANCE_STATUSES } from "../attendance/attendance.model";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

// GET /api/v1/me/enrollments
export const myEnrollmentsQuerySchema = z.object({
  ...pagination,
  status: z.enum(["ACTIVE", "COMPLETED", "WITHDRAWN"]).optional(),
});

// GET /api/v1/me/attendance
export const myAttendanceQuerySchema = z.object({
  ...pagination,
  courseId: objectId.optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type MyEnrollmentsQuery = z.infer<typeof myEnrollmentsQuerySchema>;
export type MyAttendanceQuery = z.infer<typeof myAttendanceQuerySchema>;
