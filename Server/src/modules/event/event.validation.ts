import { z } from "zod";
import { EVENT_TYPES, EVENT_STATUSES } from "./event.model";
import { objectId } from "../../lib/validation";

const dateField = z.coerce.date();

function refineEventShape(
  v: {
    eventType?: string;
    clubId?: string | null;
    startAt?: Date;
    endAt?: Date;
  },
  ctx: z.RefinementCtx
) {
  if (v.eventType === "CLUB" && v.clubId === null) {
    ctx.addIssue({
      code: "custom",
      path: ["clubId"],
      message: "Club events must have a clubId",
    });
  }
  if (v.eventType === "GENERAL" && v.clubId) {
    ctx.addIssue({
      code: "custom",
      path: ["clubId"],
      message: "General events must not be linked to a club",
    });
  }
  if (v.startAt && v.endAt && v.endAt <= v.startAt) {
    ctx.addIssue({
      code: "custom",
      path: ["endAt"],
      message: "endAt must be after startAt",
    });
  }
}

// ── POST /api/v1/events ───────────────────────────────────────────────────────

export const createEventSchema = z
  .object({
    title: z.string().trim().min(2).max(120),
    description: z.string().trim().max(1000).optional().default(""),
    eventType: z.enum(EVENT_TYPES),
    clubId: objectId.optional(),
    venue: z.string().trim().min(1).max(200),
    startAt: dateField,
    endAt: dateField,
    registrationDeadline: dateField.optional(),
    capacity: z.coerce.number().int().min(1).optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.eventType === "CLUB" && !v.clubId) {
      ctx.addIssue({
        code: "custom",
        path: ["clubId"],
        message: "Club events must have a clubId",
      });
    }
    refineEventShape(v, ctx);
  });

// ── PATCH /api/v1/events/:id ──────────────────────────────────────────────────

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(2).max(120).optional(),
    description: z.string().trim().max(1000).optional(),
    eventType: z.enum(EVENT_TYPES).optional(),
    clubId: objectId.nullable().optional(),
    venue: z.string().trim().min(1).max(200).optional(),
    startAt: dateField.optional(),
    endAt: dateField.optional(),
    registrationDeadline: dateField.nullable().optional(),
    capacity: z.coerce.number().int().min(1).nullable().optional(),
  })
  .strict()
  .refine((v) => Object.values(v).some((x) => x !== undefined), {
    message: "Provide at least one field to update",
  })
  .superRefine(refineEventShape);

// ── POST /api/v1/events/:id/reject ────────────────────────────────────────────

export const rejectEventSchema = z
  .object({
    rejectionReason: z.string().trim().min(1).max(500),
  })
  .strict();

// ── GET /api/v1/events ────────────────────────────────────────────────────────

export const listEventsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventType: z.enum(EVENT_TYPES).optional(),
  clubId: objectId.optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  search: z.string().trim().min(1).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type CreateEventBody = z.infer<typeof createEventSchema>;
export type UpdateEventBody = z.infer<typeof updateEventSchema>;
export type RejectEventBody = z.infer<typeof rejectEventSchema>;
export type ListEventsQuery = z.infer<typeof listEventsQuerySchema>;
