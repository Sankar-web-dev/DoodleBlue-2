import { z } from "zod";
import { ATTENDANCE_STATUSES } from "./attendance.model";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const statusEnum = z.enum(ATTENDANCE_STATUSES);

// POST /api/v1/attendance
// `recordedBy` is intentionally absent — it is derived from the session.
export const createAttendanceSchema = z
  .object({
    studentId: objectId,
    courseId: objectId,
    sessionDate: z.coerce.date(),
    status: statusEnum,
    note: z.string().trim().max(500).optional(),
  })
  .strict();

// PATCH /api/v1/attendance/:id
// Corrections only — the (student, course, date) identity of a record is fixed.
export const updateAttendanceSchema = z
  .object({
    status: statusEnum.optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// GET /api/v1/attendance
export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: objectId.optional(),
  courseId: objectId.optional(),
  status: statusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// :id route param
export const attendanceIdParamSchema = z.object({ id: objectId });

export type CreateAttendanceBody = z.infer<typeof createAttendanceSchema>;
export type UpdateAttendanceBody = z.infer<typeof updateAttendanceSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
