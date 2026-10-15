import { Request, Response } from "express";
import {
  createEventSchema,
  updateEventSchema,
  rejectEventSchema,
  listEventsQuerySchema,
} from "./event.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import { hasPermission } from "../auth/auth.middleware";
import * as EventService from "./event.service";
import { IUser } from "../auth/user.model";
import { IRole } from "../role/role.model";

function canManageEvents(res: Response): boolean {
  const user = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;
  return hasPermission(user, role, "events", "update");
}

/**
 * Approval-side transitions (approve / reject / publish) are SUPER_ADMIN
 * decisions — the events:update permission alone is not enough, since
 * faculty need it to create and submit their own events.
 */
function requireSuperAdmin(res: Response, action: string): boolean {
  const currentUser = res.locals.currentUser as IUser;
  if (currentUser.role !== "SUPER_ADMIN") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: `Only a super admin can ${action} events`,
      },
    });
    return false;
  }
  return true;
}

// POST /api/v1/events
export async function createEvent(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const event = await EventService.createEvent(
    parsed.data,
    currentUser._id.toString()
  );
  res.status(201).json({ success: true, data: { event } });
}

// POST /api/v1/events/upload-image — upload an event image file via multer
export async function uploadEventImage(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: {
        code: "NO_FILE_UPLOADED",
        message: "No image file provided",
      },
    });
    return;
  }

  // Construct relative URL path stored in DB and accessible via express.static
  const imageUrl = `/uploads/events/${req.file.filename}`;
  res.status(200).json({
    success: true,
    data: {
      url: imageUrl,
      filename: req.file.filename,
    },
  });
}

// GET /api/v1/events
export async function listEvents(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listEventsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const result = await EventService.listEvents(
    parsed.data,
    currentUser._id.toString(),
    canManageEvents(res)
  );
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/events/:id
export async function getEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const event = await EventService.getEventById(
    id,
    currentUser._id.toString(),
    canManageEvents(res)
  );
  res.status(200).json({ success: true, data: { event } });
}

// PATCH /api/v1/events/:id
export async function updateEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const event = await EventService.updateEvent(id, parsed.data);
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/submit — DRAFT/REJECTED → PENDING
export async function submitEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const event = await EventService.submitEvent(id);
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/approve — PENDING → APPROVED (SUPER_ADMIN only)
export async function approveEvent(
  req: Request,
  res: Response
): Promise<void> {
  if (!requireSuperAdmin(res, "approve")) return;

  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const event = await EventService.approveEvent(
    id,
    currentUser._id.toString()
  );
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/reject — PENDING → REJECTED (SUPER_ADMIN only)
export async function rejectEvent(
  req: Request,
  res: Response
): Promise<void> {
  if (!requireSuperAdmin(res, "reject")) return;

  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = rejectEventSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const event = await EventService.rejectEvent(
    id,
    parsed.data.rejectionReason
  );
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/publish — APPROVED → PUBLISHED (SUPER_ADMIN only)
export async function publishEvent(
  req: Request,
  res: Response
): Promise<void> {
  if (!requireSuperAdmin(res, "publish")) return;

  const id = parseIdParam(req, res);
  if (!id) return;

  const event = await EventService.publishEvent(id);
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/cancel — → CANCELLED
export async function cancelEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const event = await EventService.cancelEvent(id);
  res.status(200).json({ success: true, data: { event } });
}

// DELETE /api/v1/events/:id
export async function deleteEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await EventService.deleteEvent(id);
  res.status(200).json({ success: true, data: { message: "Event deleted" } });
}
