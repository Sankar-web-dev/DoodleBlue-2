import { z } from "zod";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/clubs ────────────────────────────────────────────────────────

export const createClubSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(80, "Name must be at most 80 characters"),
    description: z.string().trim().max(500).optional().default(""),
    department: z.string().trim().min(2).max(80),
    /** Optional club logo — an uploaded relative path or an external URL. */
    logoUrl: z.string().trim().min(1).max(500).optional(),
    facultyCoordinatorId: objectId,
  })
  .strict();

// ── PATCH /api/v1/clubs/:id ───────────────────────────────────────────────────

export const updateClubSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    department: z.string().trim().min(2).max(80).optional(),
    logoUrl: z.string().trim().min(1).max(500).nullable().optional(),
    facultyCoordinatorId: objectId.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// ── GET /api/v1/clubs ─────────────────────────────────────────────────────────

export const listClubsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().min(1).optional(),
  department: z.string().trim().min(1).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateClubBody = z.infer<typeof createClubSchema>;
export type UpdateClubBody = z.infer<typeof updateClubSchema>;
export type ListClubsQuery = z.infer<typeof listClubsQuerySchema>;
