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
    /** Temporary password — the user must change it on first login. */
    password: z.string().min(10).max(128),
    /** Must reference an active Role document. */
    roleId: objectId,
    /** Optional profile image URL. */
    image: z.string().trim().url().optional(),
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
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
