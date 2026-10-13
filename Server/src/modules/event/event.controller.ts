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

// POST /api/v1/events/:id/approve — PENDING → APPROVED
export async function approveEvent(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const event = await EventService.approveEvent(
    id,
    currentUser._id.toString()
  );
  res.status(200).json({ success: true, data: { event } });
}

// POST /api/v1/events/:id/reject — PENDING → REJECTED
export async function rejectEvent(
  req: Request,
  res: Response
): Promise<void> {
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

// POST /api/v1/events/:id/publish — APPROVED → PUBLISHED
export async function publishEvent(
  req: Request,
  res: Response
): Promise<void> {
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
