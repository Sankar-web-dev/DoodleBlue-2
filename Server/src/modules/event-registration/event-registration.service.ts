import mongoose from "mongoose";
import EventRegistration from "./event-registration.model";
import Event from "../event/event.model";
import Club from "../club/club.model";
import { isActiveCoordinator } from "../club-membership/club-membership.service";
import ClubMembership from "../club-membership/club-membership.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateRegistrationBody,
  ReviewRegistrationBody,
  ListRegistrationsQuery,
} from "./event-registration.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanRegistration {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanRegistration) {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    studentId: doc.studentId.toString(),
    status: doc.status,
    reviewedBy: doc.reviewedBy?.toString(),
    reviewedAt: doc.reviewedAt,
    rejectionReason: doc.rejectionReason,
    registeredAt: doc.registeredAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// Seats held by a registration — rejected/cancelled don't consume capacity.
const ACTIVE_STATUSES = ["REGISTERED", "PENDING", "APPROVED"];

// ── register ─────────────────────────────────────────────────────────────────

export async function register(input: CreateRegistrationBody, studentId: string) {
  const event = await Event.findById(input.eventId).lean();
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }
  if (event.status !== "PUBLISHED") {
    throw new ApiError(
      400,
      "EVENT_NOT_OPEN",
      "Registrations are only accepted for published events"
    );
  }
  if (
    event.registrationDeadline &&
    new Date() > new Date(event.registrationDeadline)
  ) {
    throw new ApiError(
      400,
      "REGISTRATION_CLOSED",
      "The registration deadline has passed"
    );
  }

  let status: "REGISTERED" | "PENDING";

  if (event.eventType === "CLUB") {
    // Club events are restricted to active members and need coordinator review.
    const member = await ClubMembership.exists({
      clubId: event.clubId,
      studentId,
      status: "ACTIVE",
    });
    if (!member) {
      throw new ApiError(
        403,
        "NOT_A_CLUB_MEMBER",
        "Only active members of this club can register for its events"
      );
    }
    status = "PENDING";
  } else {
    // General events: automatic registration.
    status = "REGISTERED";
  }

  if (event.capacity !== undefined) {
    const capacityFilter: Record<string, unknown> = {
      eventId: event._id,
      status: { $in: ACTIVE_STATUSES },
    };
    const taken = await EventRegistration.countDocuments(capacityFilter);
    if (taken >= event.capacity) {
      throw new ApiError(409, "EVENT_FULL", "This event has reached capacity");
    }
  }

  const duplicate = await EventRegistration.exists({
    eventId: event._id,
    studentId,
  });
  if (duplicate) {
    throw new ApiError(
      409,
      "ALREADY_REGISTERED",
      "You are already registered for this event"
    );
  }

  const registration = await EventRegistration.create({
    eventId: event._id,
    studentId,
    status,
    registeredAt: new Date(),
  });

  return toResponse(registration.toObject() as LeanRegistration);
}

// ── listRegistrations ─────────────────────────────────────────────────────────

export async function listRegistrations(
  query: ListRegistrationsQuery,
  userId: string,
  canManage: boolean
) {
  const { page, limit, eventId, studentId, status } = query;

  const filter: Record<string, unknown> = {};
  if (eventId) filter.eventId = eventId;
  if (status) filter.status = status;

  // Non-managers can only see their own registrations; managers see all.
  if (!canManage) filter.studentId = userId;
  else if (studentId) filter.studentId = studentId;

  const [total, docs] = await Promise.all([
    EventRegistration.countDocuments(filter),
    EventRegistration.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanRegistration[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getRegistrationById ───────────────────────────────────────────────────────

export async function getRegistrationById(
  id: string,
  userId: string,
  canManage: boolean
) {
  const doc = await EventRegistration.findById(id).lean();
  if (!doc || (!canManage && doc.studentId.toString() !== userId)) {
    throw new ApiError(
      404,
      "REGISTRATION_NOT_FOUND",
      "Registration not found"
    );
  }
  return toResponse(doc as unknown as LeanRegistration);
}

// ── review ────────────────────────────────────────────────────────────────────

/**
 * Coordinator decision on a PENDING registration. Only the club's active
 * student coordinator, the club's faculty coordinator, or a SUPER_ADMIN
 * may review club-event registrations.
 */
export async function reviewRegistration(
  id: string,
  input: ReviewRegistrationBody,
  reviewerId: string,
  isSuperAdmin: boolean
) {
  const registration = await EventRegistration.findById(id);
  if (!registration) {
    throw new ApiError(
      404,
      "REGISTRATION_NOT_FOUND",
      "Registration not found"
    );
  }
  if (registration.status !== "PENDING") {
    throw new ApiError(
      400,
      "REGISTRATION_NOT_PENDING",
      "Only pending registrations can be reviewed"
    );
  }

  const event = await Event.findById(registration.eventId).lean();
  if (!event || event.eventType !== "CLUB") {
    throw new ApiError(
      400,
      "NOT_REVIEWABLE",
      "Only club-event registrations require review"
    );
  }

  if (!isSuperAdmin) {
    const club = await Club.findById(event.clubId)
      .select("facultyCoordinatorId")
      .lean();
    const isFaculty =
      club?.facultyCoordinatorId.toString() === reviewerId;
    const isCoordinator = await isActiveCoordinator(
      event.clubId!.toString(),
      reviewerId
    );
    if (!isFaculty && !isCoordinator) {
      throw new ApiError(
        403,
        "NOT_EVENT_COORDINATOR",
        "Only the club coordinator or faculty coordinator can review registrations"
      );
    }
  }

  registration.status = input.status;
  registration.reviewedBy = new mongoose.Types.ObjectId(reviewerId);
  registration.reviewedAt = new Date();
  registration.rejectionReason =
    input.status === "REJECTED" ? input.rejectionReason : undefined;

  await registration.save();
  return toResponse(registration.toObject() as LeanRegistration);
}

// ── cancel ────────────────────────────────────────────────────────────────────

/** A student cancels their own registration (managers may cancel any). */
export async function cancelRegistration(
  id: string,
  userId: string,
  canManage: boolean
) {
  const registration = await EventRegistration.findById(id);
  if (!registration) {
    throw new ApiError(
      404,
      "REGISTRATION_NOT_FOUND",
      "Registration not found"
    );
  }
  if (!canManage && registration.studentId.toString() !== userId) {
    throw new ApiError(
      403,
      "NOT_YOUR_REGISTRATION",
      "You can only cancel your own registration"
    );
  }
  if (["CANCELLED", "REJECTED"].includes(registration.status)) {
    throw new ApiError(
      400,
      "ALREADY_CLOSED",
      `Registration is already ${registration.status.toLowerCase()}`
    );
  }

  registration.status = "CANCELLED";
  await registration.save();
  return toResponse(registration.toObject() as LeanRegistration);
}

// ── deleteRegistration ────────────────────────────────────────────────────────

export async function deleteRegistration(id: string) {
  const registration = await EventRegistration.findById(id);
  if (!registration) {
    throw new ApiError(
      404,
      "REGISTRATION_NOT_FOUND",
      "Registration not found"
    );
  }
  await registration.deleteOne();
}
