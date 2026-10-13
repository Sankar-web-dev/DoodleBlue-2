import { z } from "zod";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES } from "./club-membership.model";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/club-memberships ─────────────────────────────────────────────

export const createMembershipSchema = z
  .object({
    clubId: objectId,
    studentId: objectId,
    membershipRole: z.enum(MEMBERSHIP_ROLES).optional().default("MEMBER"),
  })
  .strict();

// ── PATCH /api/v1/club-memberships/:id ────────────────────────────────────────

export const updateMembershipSchema = z
  .object({
    membershipRole: z.enum(MEMBERSHIP_ROLES).optional(),
    status: z.enum(MEMBERSHIP_STATUSES).optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  });

// ── GET /api/v1/club-memberships ──────────────────────────────────────────────

export const listMembershipsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  clubId: objectId.optional(),
  studentId: objectId.optional(),
  membershipRole: z.enum(MEMBERSHIP_ROLES).optional(),
  status: z.enum(MEMBERSHIP_STATUSES).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateMembershipBody = z.infer<typeof createMembershipSchema>;
export type UpdateMembershipBody = z.infer<typeof updateMembershipSchema>;
export type ListMembershipsQuery = z.infer<typeof listMembershipsQuerySchema>;
