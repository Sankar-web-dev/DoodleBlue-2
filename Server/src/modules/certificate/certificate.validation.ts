import { z } from "zod";
import { CERTIFICATE_STATUSES } from "./certificate.model";
import { objectId } from "../../lib/validation";

// ── POST /api/v1/certificates — coordinator requests a certificate ────────────

export const requestCertificateSchema = z
  .object({
    eventId: objectId,
    studentId: objectId,
  })
  .strict();

// ── PATCH /api/v1/certificates/:id — faculty decision / issue ────────────────

export const updateCertificateSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED", "ISSUED"]),
    rejectionReason: z.string().trim().min(1).max(500).optional(),
    certificateUrl: z.string().trim().url().optional(),
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

// ── GET /api/v1/certificates ──────────────────────────────────────────────────

export const listCertificatesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  eventId: objectId.optional(),
  studentId: objectId.optional(),
  status: z.enum(CERTIFICATE_STATUSES).optional(),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type RequestCertificateBody = z.infer<typeof requestCertificateSchema>;
export type UpdateCertificateBody = z.infer<typeof updateCertificateSchema>;
export type ListCertificatesQuery = z.infer<typeof listCertificatesQuerySchema>;
