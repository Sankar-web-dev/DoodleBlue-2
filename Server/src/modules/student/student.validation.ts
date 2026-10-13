import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/v1/students
export const createStudentSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    studentNumber: z
      .string()
      .trim()
      .min(1)
      .max(50)
      .transform((v) => v.toUpperCase()),
    departmentId: objectId,
    phone: z.string().trim().min(5).max(20).optional(),
    admissionDate: z.coerce.date().optional(),
    temporaryPassword: z.string().min(8).max(128),
  })
  .strict();

// PATCH /api/v1/students/:id
export const updateStudentSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phone: z.string().trim().min(5).max(20).nullable().optional(),
    departmentId: objectId.optional(),
    admissionDate: z.coerce.date().nullable().optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// PATCH /api/v1/students/:id/status
export const updateStudentStatusSchema = z
  .object({
    status: z.enum(["ACTIVE", "INACTIVE"]),
  })
  .strict();

// GET /api/v1/students
export const listStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  departmentId: objectId.optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

// :id route param
export const studentIdParamSchema = z.object({ id: objectId });

export type CreateStudentBody = z.infer<typeof createStudentSchema>;
export type UpdateStudentBody = z.infer<typeof updateStudentSchema>;
export type UpdateStudentStatusBody = z.infer<
  typeof updateStudentStatusSchema
>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
