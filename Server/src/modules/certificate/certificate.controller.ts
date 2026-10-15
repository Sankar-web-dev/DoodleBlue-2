import { Request, Response } from "express";
import {
  requestCertificateSchema,
  updateCertificateSchema,
  listCertificatesQuerySchema,
} from "./certificate.validation";
import { sendValidationError, parseIdParam } from "../../lib/validation";
import { hasPermission } from "../auth/auth.middleware";
import * as CertificateService from "./certificate.service";
import { IUser } from "../auth/user.model";
import { IRole } from "../role/role.model";

function canManageCertificates(res: Response): boolean {
  const user = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;
  // Requesters (create) and approvers (update) both need the managed-event
  // scope — not just their own certificates.
  return (
    hasPermission(user, role, "certificates", "update") ||
    hasPermission(user, role, "certificates", "create")
  );
}

// POST /api/v1/certificates — coordinator requests a certificate
export async function requestCertificate(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = requestCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const currentRole = res.locals.currentRole as IRole | null;
  const certificate = await CertificateService.requestCertificate(
    parsed.data,
    currentUser._id.toString(),
    currentRole?.name ?? currentUser.role
  );
  res.status(201).json({ success: true, data: { certificate } });
}

// GET /api/v1/certificates
export async function listCertificates(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listCertificatesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const role = res.locals.currentRole as IRole | null;
  const result = await CertificateService.listCertificates(
    parsed.data,
    currentUser._id.toString(),
    canManageCertificates(res),
    role?.name ?? currentUser.role
  );
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/certificates/:id
export async function getCertificate(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const currentUser = res.locals.currentUser as IUser;
  const certificate = await CertificateService.getCertificateById(
    id,
    currentUser._id.toString(),
    canManageCertificates(res)
  );
  res.status(200).json({ success: true, data: { certificate } });
}

// PATCH /api/v1/certificates/:id — faculty approve / reject / issue
export async function updateCertificate(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  const parsed = updateCertificateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const currentUser = res.locals.currentUser as IUser;
  const currentRole = res.locals.currentRole as IRole | null;
  const certificate = await CertificateService.updateCertificate(
    id,
    parsed.data,
    currentUser._id.toString(),
    currentRole?.name ?? currentUser.role
  );
  res.status(200).json({ success: true, data: { certificate } });
}

// DELETE /api/v1/certificates/:id
export async function deleteCertificate(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseIdParam(req, res);
  if (!id) return;

  await CertificateService.deleteCertificate(id);
  res.status(200).json({
    success: true,
    data: { message: "Certificate deleted" },
  });
}
