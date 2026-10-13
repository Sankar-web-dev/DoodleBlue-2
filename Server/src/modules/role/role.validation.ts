import { z } from "zod";
import { RESOURCES, ACTIONS } from "./role.model";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

// ── Permission entry schema ───────────────────────────────────────────────────

const permissionSchema = z.object({
  resource: z.enum(RESOURCES),
  actions: z
    .array(z.enum(ACTIONS))
    .min(1, "At least one action is required per permission"),
});

// ── POST /api/v1/roles ────────────────────────────────────────────────────────

export const createRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(60, "Name must be at most 60 characters"),
    description: z.string().trim().max(200).optional().default(""),
    permissions: z
      .array(permissionSchema)
      .min(1, "At least one permission is required"),
  })
  .strict();

// ── PATCH /api/v1/roles/:id ───────────────────────────────────────────────────

export const updateRoleSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    description: z.string().trim().max(200).optional(),
    permissions: z.array(permissionSchema).min(1).optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// ── GET /api/v1/roles ─────────────────────────────────────────────────────────

export const listRolesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().min(1).optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

// ── :id param ─────────────────────────────────────────────────────────────────

export const roleIdParamSchema = z.object({ id: objectId });

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateRoleBody = z.infer<typeof createRoleSchema>;
export type UpdateRoleBody = z.infer<typeof updateRoleSchema>;
export type ListRolesQuery = z.infer<typeof listRolesQuerySchema>;
