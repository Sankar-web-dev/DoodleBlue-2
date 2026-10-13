import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// POST /api/v1/admins
// Caller may optionally provide a roleId. When omitted, the service will fall
// back to the system "ADMIN" role so the behaviour is backward-compatible.
export const createAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    // Same strength policy as change-password in the auth module.
    temporaryPassword: z.string().min(10).max(128),
    /** Optional — defaults to the system ADMIN role when not supplied. */
    roleId: objectId.optional(),
  })
  .strict();

// PATCH /api/v1/admins/:id
// `email` is the login identity and `roleId` must not change here — not updatable.
export const updateAdminSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// GET /api/v1/admins
export const listAdminsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// :id route param
export const adminIdParamSchema = z.object({ id: objectId });

export type CreateAdminBody = z.infer<typeof createAdminSchema>;
export type UpdateAdminBody = z.infer<typeof updateAdminSchema>;
export type ListAdminsQuery = z.infer<typeof listAdminsQuerySchema>;
