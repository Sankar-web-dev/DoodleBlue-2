import { Request, Response } from "express";
import {
  createRegistrationSchema,
  reviewRegistrationSchema,
  listRegistrationsQuerySchema,
} from "./event-registration.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import { hasPermission } from "../auth/auth.middleware";
import * as RegistrationService from "./event-registration.service";
import { IUser } from "../auth/user.model";
import { IRole } from "../role/role.model";

function canManageRegistrations(res: Response): boolean {
  const user = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;
  return hasPermission(user, role, "eventRegistrations", "update");
}

// POST /api/v1/event-registrations — register the current user for an event
export async function register(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const registration = await RegistrationService.register(
    parsed.data,
    currentUser._id.toString()
  );
  res.status(201).json({ success: true, data: { registration } });
}

// GET /api/v1/event-registrations
export async function listRegistrations(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listRegistrationsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const result = await RegistrationService.listRegistrations(
    parsed.data,
    currentUser._id.toString(),
    canManageRegistrations(res)
  );
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/event-registrations/:id
export async function getRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const registration = await RegistrationService.getRegistrationById(
    id,
    currentUser._id.toString(),
    canManageRegistrations(res)
  );
  res.status(200).json({ success: true, data: { registration } });
}

// PATCH /api/v1/event-registrations/:id — coordinator approve/reject
export async function reviewRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = reviewRegistrationSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const registration = await RegistrationService.reviewRegistration(
    id,
    parsed.data,
    currentUser._id.toString(),
    currentUser.role === "SUPER_ADMIN"
  );
  res.status(200).json({ success: true, data: { registration } });
}

// POST /api/v1/event-registrations/:id/cancel — cancel own registration
export async function cancelRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const registration = await RegistrationService.cancelRegistration(
    id,
    currentUser._id.toString(),
    canManageRegistrations(res)
  );
  res.status(200).json({ success: true, data: { registration } });
}

// DELETE /api/v1/event-registrations/:id
export async function deleteRegistration(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await RegistrationService.deleteRegistration(id);
  res.status(200).json({
    success: true,
    data: { message: "Registration deleted" },
  });
}
