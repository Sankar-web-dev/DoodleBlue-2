import crypto from "node:crypto";
import mongoose from "mongoose";
import Certificate from "./certificate.model";
import Event from "../event/event.model";
import Club from "../club/club.model";
import EventRegistration from "../event-registration/event-registration.model";
import Attendance from "../attendance/attendance.model";
import { isActiveCoordinator } from "../club-membership/club-membership.service";
import { managedEventIds } from "../event/event.service";
import { isEventCoordinator } from "../../lib/roles";
import { ApiError } from "../../lib/ApiError";
import type {
  RequestCertificateBody,
  UpdateCertificateBody,
  ListCertificatesQuery,
} from "./certificate.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanCertificate {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: string;
  certificateNumber?: string;
  certificateUrl?: string;
  approvedAt?: Date;
  issuedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanCertificate) {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    studentId: doc.studentId.toString(),
    issuedBy: doc.issuedBy.toString(),
    approvedBy: doc.approvedBy?.toString(),
    status: doc.status,
    certificateNumber: doc.certificateNumber,
    certificateUrl: doc.certificateUrl,
    approvedAt: doc.approvedAt,
    issuedAt: doc.issuedAt,
    rejectionReason: doc.rejectionReason,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CERT-${year}-${rand}`;
}

/**
 * Club events: actor must be the club's faculty coordinator, an active
 * student coordinator (when not facultyOnly), or SUPER_ADMIN. General
 * events are owned by the EVENT COORDINATOR role (or SUPER_ADMIN).
 */
async function assertEventActor(
  event: { eventType: string; clubId?: mongoose.Types.ObjectId },
  userId: string,
  roleName: string,
  opts: { facultyOnly: boolean },
  errorCode: string
): Promise<void> {
  if (roleName === "SUPER_ADMIN") return;

  if (event.eventType === "GENERAL") {
    if (!isEventCoordinator(roleName)) {
      throw new ApiError(
        403,
        errorCode,
        "Only the event coordinator can manage certificates for general events"
      );
    }
    return;
  }

  const club = await Club.findById(event.clubId)
    .select("facultyCoordinatorId")
    .lean();
  const isFaculty = club?.facultyCoordinatorId.toString() === userId;

  if (opts.facultyOnly) {
    if (!isFaculty) {
      throw new ApiError(
        403,
        errorCode,
        "Only the club faculty coordinator can decide certificates"
      );
    }
    return;
  }

  const isCoordinator = await isActiveCoordinator(
    event.clubId!.toString(),
    userId
  );
  if (!isFaculty && !isCoordinator) {
    throw new ApiError(
      403,
      errorCode,
      "Only the club coordinator or faculty coordinator can perform this action"
    );
  }
}

// ── requestCertificate ───────────────────────────────────────────────────────

/**
 * The club student coordinator initiates a certificate request for a student
 * who has a confirmed registration and was marked PRESENT.
 */
export async function requestCertificate(
  input: RequestCertificateBody,
  requesterId: string,
  requesterRole: string
) {
  const event = await Event.findById(input.eventId).lean();
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  await assertEventActor(
    event,
    requesterId,
    requesterRole,
    { facultyOnly: false },
    "NOT_EVENT_COORDINATOR"
  );

  const [registration, present] = await Promise.all([
    EventRegistration.exists({
      eventId: event._id,
      studentId: input.studentId,
      status: { $in: ["REGISTERED", "APPROVED"] },
    }),
    Attendance.exists({
      eventId: event._id,
      studentId: input.studentId,
      status: "PRESENT",
    }),
  ]);

  if (!registration || !present) {
    throw new ApiError(
      400,
      "CERTIFICATE_NOT_ELIGIBLE",
      "The student must be registered and marked present before a certificate can be requested"
    );
  }

  const duplicate = await Certificate.exists({
    eventId: event._id,
    studentId: input.studentId,
  });
  if (duplicate) {
    throw new ApiError(
      409,
      "CERTIFICATE_EXISTS",
      "A certificate already exists for this student and event"
    );
  }

  const certificate = await Certificate.create({
    eventId: event._id,
    studentId: input.studentId,
    issuedBy: requesterId,
    status: "PENDING",
  });

  return toResponse(certificate.toObject() as LeanCertificate);
}

// ── listCertificates ──────────────────────────────────────────────────────────

export async function listCertificates(
  query: ListCertificatesQuery,
  userId: string,
  canManage: boolean,
  roleName: string
) {
  const { page, limit, eventId, studentId, status } = query;

  const filter: Record<string, unknown> = {};
  if (eventId) filter.eventId = eventId;
  if (status) filter.status = status;
  // Non-managers see only their own certificates. Non-super-admin managers
  // see certificates for events they manage — club staff see club events,
  // the event coordinator sees general events.
  if (!canManage) {
    filter.studentId = userId;
  } else {
    const managed = await managedEventIds(userId, roleName);
    if (managed !== null) {
      filter.$or = [
        { studentId: userId },
        ...(managed.length > 0 ? [{ eventId: { $in: managed } }] : []),
      ];
    }
    if (studentId) filter.studentId = studentId;
  }

  const [total, docs] = await Promise.all([
    Certificate.countDocuments(filter),
    Certificate.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanCertificate[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getCertificateById ────────────────────────────────────────────────────────

export async function getCertificateById(
  id: string,
  userId: string,
  canManage: boolean
) {
  const doc = await Certificate.findById(id).lean();
  if (!doc || (!canManage && doc.studentId.toString() !== userId)) {
    throw new ApiError(
      404,
      "CERTIFICATE_NOT_FOUND",
      "Certificate not found"
    );
  }
  return toResponse(doc as unknown as LeanCertificate);
}

// ── updateCertificate — approve / reject / issue ─────────────────────────────

export async function updateCertificate(
  id: string,
  input: UpdateCertificateBody,
  actorId: string,
  actorRole: string
) {
  const certificate = await Certificate.findById(id);
  if (!certificate) {
    throw new ApiError(
      404,
      "CERTIFICATE_NOT_FOUND",
      "Certificate not found"
    );
  }

  const event = await Event.findById(certificate.eventId).lean();
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  // Approving / rejecting / issuing is a faculty decision for club events;
  // the event coordinator decides for general events.
  await assertEventActor(
    event,
    actorId,
    actorRole,
    { facultyOnly: true },
    "NOT_CLUB_FACULTY"
  );

  switch (input.status) {
    case "APPROVED": {
      if (certificate.status !== "PENDING") {
        throw new ApiError(
          400,
          "INVALID_CERTIFICATE_STATUS",
          "Only pending certificates can be approved"
        );
      }
      certificate.status = "APPROVED";
      certificate.approvedBy = new mongoose.Types.ObjectId(actorId);
      certificate.approvedAt = new Date();
      break;
    }
    case "REJECTED": {
      if (certificate.status !== "PENDING") {
        throw new ApiError(
          400,
          "INVALID_CERTIFICATE_STATUS",
          "Only pending certificates can be rejected"
        );
      }
      certificate.status = "REJECTED";
      certificate.rejectionReason = input.rejectionReason;
      break;
    }
    case "ISSUED": {
      if (certificate.status !== "APPROVED") {
        throw new ApiError(
          400,
          "INVALID_CERTIFICATE_STATUS",
          "Only approved certificates can be issued"
        );
      }
      certificate.status = "ISSUED";
      certificate.certificateNumber = generateCertificateNumber();
      if (input.certificateUrl !== undefined) {
        certificate.certificateUrl = input.certificateUrl;
      }
      certificate.issuedAt = new Date();
      break;
    }
  }

  await certificate.save();
  return toResponse(certificate.toObject() as LeanCertificate);
}

// ── deleteCertificate ─────────────────────────────────────────────────────────

export async function deleteCertificate(id: string) {
  const certificate = await Certificate.findById(id);
  if (!certificate) {
    throw new ApiError(
      404,
      "CERTIFICATE_NOT_FOUND",
      "Certificate not found"
    );
  }
  await certificate.deleteOne();
}
