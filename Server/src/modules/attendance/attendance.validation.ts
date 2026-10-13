import { z } from "zod";
import { ATTENDANCE_STATUSES } from "./attendance.model";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/attendance ───────────────────────────────────────────────────

export const markAttendanceSchema = z
  .object({
    eventId: objectId,
    studentId: objectId,
    status: z.enum(ATTENDANCE_STATUSES),
  })
  .strict();

// ── PATCH /api/v1/attendance/:id ──────────────────────────────────────────────

export const updateAttendanceSchema = z
  .object({
    status: z.enum(ATTENDANCE_STATUSES),
  })
  .strict();

// ── GET /api/v1/attendance ────────────────────────────────────────────────────

export const listAttendanceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventId: objectId.optional(),
  studentId: objectId.optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type MarkAttendanceBody = z.infer<typeof markAttendanceSchema>;
export type UpdateAttendanceBody = z.infer<typeof updateAttendanceSchema>;
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;
