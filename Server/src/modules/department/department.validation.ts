import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/v1/departments
export const createDepartmentSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    code: z
      .string()
      .trim()
      .min(2)
      .max(20)
      .regex(/^[A-Za-z0-9-]+$/, "Code may only contain letters, numbers and hyphens")
      .transform((v) => v.toUpperCase()),
  })
  .strict();

// PATCH /api/v1/departments/:id
// `code` is treated as an immutable identifier — not updatable.
export const updateDepartmentSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// GET /api/v1/departments
export const listDepartmentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  // Query params arrive as strings — "false" would be truthy under
  // z.coerce.boolean(), so parse explicitly.
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// :id route param
export const departmentIdParamSchema = z.object({ id: objectId });

export type CreateDepartmentBody = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentBody = z.infer<typeof updateDepartmentSchema>;
export type ListDepartmentsQuery = z.infer<typeof listDepartmentsQuerySchema>;
