import { Request, Response } from "express";
import { z, ZodError } from "zod";

export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

/** Send the standard 400 VALIDATION_ERROR envelope for a failed zod parse. */
export function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    },
  });
}

/** Parse a :id route param as an ObjectId; sends 400 and returns null on failure. */
export function parseIdParam(req: Request, res: Response): string | null {
  const parsed = z.object({ id: objectId }).safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid id" },
    });
    return null;
  }
  return parsed.data.id;
}
