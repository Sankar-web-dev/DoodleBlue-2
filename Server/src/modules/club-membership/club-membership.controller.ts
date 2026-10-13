import { Request, Response } from "express";
import {
  createMembershipSchema,
  updateMembershipSchema,
  listMembershipsQuerySchema,
} from "./club-membership.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import * as MembershipService from "./club-membership.service";
import { IUser } from "../auth/user.model";

// POST /api/v1/club-memberships
export async function createMembership(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createMembershipSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const membership = await MembershipService.createMembership(
    parsed.data,
    currentUser._id.toString()
  );
  res.status(201).json({ success: true, data: { membership } });
}

// GET /api/v1/club-memberships
export async function listMemberships(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listMembershipsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await MembershipService.listMemberships(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/club-memberships/:id
export async function getMembership(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const membership = await MembershipService.getMembershipById(id);
  res.status(200).json({ success: true, data: { membership } });
}

// PATCH /api/v1/club-memberships/:id
export async function updateMembership(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateMembershipSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const membership = await MembershipService.updateMembership(id, parsed.data);
  res.status(200).json({ success: true, data: { membership } });
}

// DELETE /api/v1/club-memberships/:id
export async function deleteMembership(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await MembershipService.deleteMembership(id);
  res.status(200).json({
    success: true,
    data: { message: "Membership removed" },
  });
}
