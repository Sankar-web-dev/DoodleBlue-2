import mongoose from "mongoose";
import Event, { IEvent, EventStatus } from "./event.model";
import Club from "../club/club.model";
import ClubMembership from "../club-membership/club-membership.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateEventBody,
  UpdateEventBody,
  ListEventsQuery,
} from "./event.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanEvent {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  eventType: string;
  clubId?: mongoose.Types.ObjectId;
  venue: string;
  startAt: Date;
  endAt: Date;
  registrationDeadline?: Date;
  capacity?: number;
  createdBy: mongoose.Types.ObjectId;
  status: string;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanEvent) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    clubId: doc.clubId?.toString(),
    venue: doc.venue,
    startAt: doc.startAt,
    endAt: doc.endAt,
    registrationDeadline: doc.registrationDeadline,
    capacity: doc.capacity,
    createdBy: doc.createdBy.toString(),
    status: doc.status,
    approvedBy: doc.approvedBy?.toString(),
    approvedAt: doc.approvedAt,
    rejectionReason: doc.rejectionReason,
    publishedAt: doc.publishedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function transition(event: IEvent, allowed: EventStatus[], target: EventStatus) {
  if (!allowed.includes(event.status)) {
    throw new ApiError(
      400,
      "INVALID_EVENT_STATUS",
      `Cannot move an event from ${event.status} to ${target}`
    );
  }
  event.status = target;
}

// ── createEvent ───────────────────────────────────────────────────────────────

export async function createEvent(input: CreateEventBody, createdBy: string) {
  if (input.eventType === "CLUB") {
    const club = await Club.findById(input.clubId).select("isActive").lean();
    if (!club || !club.isActive) {
      throw new ApiError(
        400,
        "INVALID_CLUB",
        "clubId must reference an active club"
      );
    }
  }

  const event = await Event.create({
    title: input.title,
    description: input.description ?? "",
    eventType: input.eventType,
    clubId: input.eventType === "CLUB" ? input.clubId : undefined,
    venue: input.venue,
    startAt: input.startAt,
    endAt: input.endAt,
    registrationDeadline: input.registrationDeadline,
    capacity: input.capacity,
    createdBy,
    status: "DRAFT",
  });

  return toResponse(event.toObject() as LeanEvent);
}

// ── listEvents ────────────────────────────────────────────────────────────────

/**
 * Managers (events:update) see every event with full filters.
 * Everyone else sees only PUBLISHED events — GENERAL for all students, CLUB
 * only for clubs they actively belong to.
 */
export async function listEvents(
  query: ListEventsQuery,
  userId: string,
  canManage: boolean
) {
  const { page, limit, eventType, clubId, status, search } = query;

  const filter: Record<string, unknown> = {};

  if (canManage) {
    if (eventType) filter.eventType = eventType;
    if (clubId) filter.clubId = clubId;
    if (status) filter.status = status;
  } else {
    filter.status = "PUBLISHED";
    if (eventType) filter.eventType = eventType;
    if (clubId) filter.clubId = clubId;

    // Restrict club events to the user's active memberships.
    const memberships = await ClubMembership.find({
      studentId: userId,
      status: "ACTIVE",
    })
      .select("clubId")
      .lean();
    const clubIds = memberships.map((m) => m.clubId);

    filter.$or = [
      { eventType: "GENERAL" },
      { eventType: "CLUB", clubId: { $in: clubIds } },
    ];
  }

  if (search) {
    filter.title = { $regex: escapeRegex(search), $options: "i" };
  }

  const [total, docs] = await Promise.all([
    Event.countDocuments(filter),
    Event.find(filter)
      .sort({ startAt: 1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanEvent[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── getEventById ──────────────────────────────────────────────────────────────

export async function getEventById(
  id: string,
  userId: string,
  canManage: boolean
) {
  const doc = await Event.findById(id).lean();
  if (!doc) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  if (!canManage) {
    if (doc.status !== "PUBLISHED") {
      throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
    }
    if (doc.eventType === "CLUB") {
      const member = await ClubMembership.exists({
        clubId: doc.clubId,
        studentId: userId,
        status: "ACTIVE",
      });
      if (!member) {
        throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
      }
    }
  }

  return toResponse(doc as unknown as LeanEvent);
}

// ── updateEvent ───────────────────────────────────────────────────────────────

export async function updateEvent(id: string, input: UpdateEventBody) {
  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  if (["PUBLISHED", "CANCELLED"].includes(event.status)) {
    throw new ApiError(
      400,
      "EVENT_LOCKED",
      `A ${event.status.toLowerCase()} event can no longer be edited`
    );
  }

  const eventType = input.eventType ?? event.eventType;

  // Re-validate the club linkage on the merged result.
  if (eventType === "CLUB") {
    const clubId =
      input.clubId === null ? undefined : input.clubId ?? event.clubId?.toString();
    if (!clubId) {
      throw new ApiError(
        400,
        "CLUB_REQUIRED",
        "Club events must have a clubId"
      );
    }
    const club = await Club.findById(clubId).select("isActive").lean();
    if (!club || !club.isActive) {
      throw new ApiError(
        400,
        "INVALID_CLUB",
        "clubId must reference an active club"
      );
    }
    event.clubId = new mongoose.Types.ObjectId(clubId);
  } else {
    event.clubId = undefined;
  }

  const startAt = input.startAt ?? event.startAt;
  const endAt = input.endAt ?? event.endAt;
  if (endAt <= startAt) {
    throw new ApiError(400, "INVALID_DATES", "endAt must be after startAt");
  }

  if (input.title !== undefined) event.title = input.title;
  if (input.description !== undefined) event.description = input.description;
  if (input.eventType !== undefined) event.eventType = input.eventType;
  if (input.venue !== undefined) event.venue = input.venue;
  event.startAt = startAt;
  event.endAt = endAt;
  if (input.registrationDeadline !== undefined) {
    event.registrationDeadline = input.registrationDeadline ?? undefined;
  }
  if (input.capacity !== undefined) {
    event.capacity = input.capacity ?? undefined;
  }

  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// ── Status transitions ────────────────────────────────────────────────────────

async function loadEvent(id: string): Promise<IEvent> {
  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }
  return event;
}

// DRAFT/REJECTED → PENDING (creator submits for Super Admin review)
export async function submitEvent(id: string) {
  const event = await loadEvent(id);
  transition(event, ["DRAFT", "REJECTED"], "PENDING");
  event.rejectionReason = undefined;
  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// PENDING → APPROVED
export async function approveEvent(id: string, approverId: string) {
  const event = await loadEvent(id);
  transition(event, ["PENDING"], "APPROVED");
  event.approvedBy = new mongoose.Types.ObjectId(approverId);
  event.approvedAt = new Date();
  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// PENDING → REJECTED
export async function rejectEvent(id: string, reason: string) {
  const event = await loadEvent(id);
  transition(event, ["PENDING"], "REJECTED");
  event.rejectionReason = reason;
  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// APPROVED → PUBLISHED
export async function publishEvent(id: string) {
  const event = await loadEvent(id);
  transition(event, ["APPROVED"], "PUBLISHED");
  event.publishedAt = new Date();
  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// DRAFT|PENDING|APPROVED|PUBLISHED → CANCELLED
export async function cancelEvent(id: string) {
  const event = await loadEvent(id);
  transition(
    event,
    ["DRAFT", "PENDING", "APPROVED", "PUBLISHED"],
    "CANCELLED"
  );
  await event.save();
  return toResponse(event.toObject() as LeanEvent);
}

// ── deleteEvent ───────────────────────────────────────────────────────────────

export async function deleteEvent(id: string) {
  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }
  if (!["DRAFT", "REJECTED", "CANCELLED"].includes(event.status)) {
    throw new ApiError(
      409,
      "EVENT_IN_USE",
      "Only draft, rejected, or cancelled events can be deleted"
    );
  }
  await event.deleteOne();
}
