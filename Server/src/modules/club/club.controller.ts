import { Request, Response } from "express";
import {
  createClubSchema,
  updateClubSchema,
  listClubsQuerySchema,
} from "./club.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import * as ClubService from "./club.service";
import { IUser } from "../auth/user.model";

// POST /api/v1/clubs
export async function createClub(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createClubSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const club = await ClubService.createClub(
    parsed.data,
    currentUser._id.toString()
  );
  res.status(201).json({ success: true, data: { club } });
}

// GET /api/v1/clubs
export async function listClubs(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listClubsQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await ClubService.listClubs(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/clubs/:id
export async function getClub(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const club = await ClubService.getClubById(id);
  res.status(200).json({ success: true, data: { club } });
}

// PATCH /api/v1/clubs/:id
export async function updateClub(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateClubSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const club = await ClubService.updateClub(
    id,
    parsed.data,
    currentUser.role === "SUPER_ADMIN"
  );
  res.status(200).json({ success: true, data: { club } });
}

// PATCH /api/v1/clubs/:id/approve — SUPER_ADMIN only
export async function approveClub(
  req: Request,
  res: Response
): Promise<void> {
  const currentUser = res.locals.currentUser as IUser;
  if (currentUser.role !== "SUPER_ADMIN") {
    res.status(403).json({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Only a super admin can approve clubs",
      },
    });
    return;
  }

  const id = parseIdParam(req, res);
  if (!id) return;

  const club = await ClubService.approveClub(id);
  res.status(200).json({ success: true, data: { club } });
}

// DELETE /api/v1/clubs/:id
export async function deleteClub(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await ClubService.deleteClub(id);
  res.status(200).json({ success: true, data: { message: "Club deleted" } });
}
