import { z } from "zod";
import { REGISTRATION_STATUSES } from "./event-registration.model";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/event-registrations ──────────────────────────────────────────

export const createRegistrationSchema = z
  .object({
    eventId: objectId,
  })
  .strict();

// ── PATCH /api/v1/event-registrations/:id — coordinator review ────────────────

export const reviewRegistrationSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.status === "REJECTED" && !v.rejectionReason) {
      ctx.addIssue({
        code: "custom",
        path: ["rejectionReason"],
        message: "rejectionReason is required when rejecting",
      });
    }
  });

// ── GET /api/v1/event-registrations ───────────────────────────────────────────

export const listRegistrationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventId: objectId.optional(),
  studentId: objectId.optional(),
  status: z.enum(REGISTRATION_STATUSES).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateRegistrationBody = z.infer<typeof createRegistrationSchema>;
export type ReviewRegistrationBody = z.infer<typeof reviewRegistrationSchema>;
export type ListRegistrationsQuery = z.infer<typeof listRegistrationsQuerySchema>;
