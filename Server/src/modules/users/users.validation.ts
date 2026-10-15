import { z } from "zod";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/users — SUPER_ADMIN provisions a user with a role ───────────

export const createUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    /**
     * Optional — when omitted the server generates a temporary password and
     * emails it to the user. Either way they must change it on first login.
     */
    password: z.string().min(10).max(128).optional(),
    /** Must reference an active Role document. */
    roleId: objectId,
    /** Optional profile image URL or relative path. */
    image: z.string().trim().min(1).max(500).optional(),
  })
  .strict();

// ── PATCH /api/v1/users/:id — update user details, role, or active status ──────

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase())
      .optional(),
    password: z.string().min(10).max(128).optional(),
    roleId: objectId.optional(),
    image: z.string().trim().min(1).max(500).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

// ── GET /api/v1/users ─────────────────────────────────────────────────────────

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateUserBody = z.infer<typeof createUserSchema>;
export type UpdateUserBody = z.infer<typeof updateUserSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
