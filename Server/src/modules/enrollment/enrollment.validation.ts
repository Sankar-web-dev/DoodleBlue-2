import { z } from "zod";
import { ENROLLMENT_STATUSES } from "./enrollment.model";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/v1/enrollments
export const createEnrollmentSchema = z
  .object({
    studentId: objectId,
    courseId: objectId,
  })
  .strict();

// PATCH /api/v1/enrollments/:id
export const updateEnrollmentSchema = z
  .object({
    status: z.enum(ENROLLMENT_STATUSES),
  })
  .strict();

// GET /api/v1/enrollments
export const listEnrollmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  studentId: objectId.optional(),
  courseId: objectId.optional(),
  status: z.enum(ENROLLMENT_STATUSES).optional(),
});

// :id route param
export const enrollmentIdParamSchema = z.object({ id: objectId });

export type CreateEnrollmentBody = z.infer<typeof createEnrollmentSchema>;
export type UpdateEnrollmentBody = z.infer<typeof updateEnrollmentSchema>;
export type ListEnrollmentsQuery = z.infer<typeof listEnrollmentsQuerySchema>;
