import mongoose from "mongoose";
import Attendance from "./attendance.model";
import Event from "../event/event.model";
import Club from "../club/club.model";
import EventRegistration from "../event-registration/event-registration.model";
import { isActiveCoordinator } from "../club-membership/club-membership.service";
import { managedEventIds } from "../event/event.service";
import { isEventCoordinator } from "../../lib/roles";
import { ApiError } from "../../lib/ApiError";
import type {
  MarkAttendanceBody,
  UpdateAttendanceBody,
  ListAttendanceQuery,
} from "./attendance.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanAttendance {
  _id: mongoose.Types.ObjectId;
  eventId:
    | mongoose.Types.ObjectId
    | {
        _id: mongoose.Types.ObjectId;
        title: string;
        eventType: string;
        venue: string;
        startAt: Date;
      };
  studentId:
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId; name: string; email: string };
  markedBy:
    | mongoose.Types.ObjectId
    | { _id: mongoose.Types.ObjectId; name: string };
  status: string;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function refId(
  value: mongoose.Types.ObjectId | { _id: mongoose.Types.ObjectId } | null
) {
  if (value == null) return "";
  return value instanceof mongoose.Types.ObjectId
    ? value.toString()
    : value._id.toString();
}

/**
 * Emits flat ids plus populated display objects so clients don't need extra
 * /events or /users calls (which require separate permissions).
 */
function toResponse(doc: LeanAttendance) {
  // Populated refs are null when the referenced doc no longer exists.
  const event = doc.eventId && typeof doc.eventId === "object" && "title" in doc.eventId
    ? {
        id: doc.eventId._id.toString(),
        title: doc.eventId.title,
        eventType: doc.eventId.eventType,
        venue: doc.eventId.venue,
        startAt: doc.eventId.startAt,
      }
    : undefined;
  const student = doc.studentId && typeof doc.studentId === "object" && "name" in doc.studentId
    ? {
        id: doc.studentId._id.toString(),
        name: doc.studentId.name,
        email: doc.studentId.email,
      }
    : undefined;
  const marker =
    doc.markedBy && typeof doc.markedBy === "object" && "name" in doc.markedBy
      ? { id: doc.markedBy._id.toString(), name: doc.markedBy.name }
      : undefined;

  return {
    id: doc._id.toString(),
    eventId: refId(doc.eventId),
    studentId: refId(doc.studentId),
    markedBy: refId(doc.markedBy),
    event,
    student,
    markedByUser: marker,
    status: doc.status,
    markedAt: doc.markedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

const ATTENDANCE_POPULATE = [
  { path: "eventId", select: "title eventType venue startAt" },
  { path: "studentId", select: "name email" },
  { path: "markedBy", select: "name" },
];

/**
 * Club events: marker must be the club's faculty coordinator, an active
 * student coordinator, or SUPER_ADMIN. General events are owned by the
 * EVENT COORDINATOR role (or SUPER_ADMIN).
 */
async function assertAuthorizedMarker(
  event: { eventType: string; clubId?: mongoose.Types.ObjectId },
  markerId: string,
  markerRole: string
): Promise<void> {
  if (markerRole === "SUPER_ADMIN") return;

  if (event.eventType === "GENERAL") {
    if (!isEventCoordinator(markerRole)) {
      throw new ApiError(
        403,
        "NOT_EVENT_COORDINATOR",
        "Only the event coordinator can mark attendance for general events"
      );
    }
    return;
  }

  const club = await Club.findById(event.clubId)
    .select("facultyCoordinatorId")
    .lean();
  const isFaculty = club?.facultyCoordinatorId.toString() === markerId;
  const isCoordinator = await isActiveCoordinator(
    event.clubId!.toString(),
    markerId
  );

  if (!isFaculty && !isCoordinator) {
    throw new ApiError(
      403,
      "NOT_EVENT_COORDINATOR",
      "Only the club coordinator or faculty coordinator can mark attendance"
    );
  }
}

// ── markAttendance ────────────────────────────────────────────────────────────

export async function markAttendance(
  input: MarkAttendanceBody,
  markerId: string,
  markerRole: string
) {
  const event = await Event.findById(input.eventId).lean();
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  // Attendance can only be recorded once the event has started.
  if (event.startAt.getTime() > Date.now()) {
    throw new ApiError(
      400,
      "EVENT_NOT_STARTED",
      "Attendance opens when the event starts"
    );
  }

  await assertAuthorizedMarker(event, markerId, markerRole);

  // The student must hold a confirmed registration —
  // APPROVED (club) or REGISTERED/APPROVED (general, auto-registered).
  const registration = await EventRegistration.findOne({
    eventId: event._id,
    studentId: input.studentId,
    status: { $in: ["REGISTERED", "APPROVED"] },
  }).lean();

  if (!registration) {
    throw new ApiError(
      400,
      "NO_CONFIRMED_REGISTRATION",
      "The student must have a confirmed registration before attendance can be marked"
    );
  }

  const duplicate = await Attendance.exists({
    eventId: event._id,
    studentId: input.studentId,
  });
  if (duplicate) {
    throw new ApiError(
      409,
      "ATTENDANCE_EXISTS",
      "Attendance is already recorded for this student"
    );
  }

  const attendance = await Attendance.create({
    eventId: event._id,
    studentId: input.studentId,
    markedBy: markerId,
    status: input.status,
    markedAt: new Date(),
  });
  await attendance.populate(ATTENDANCE_POPULATE);

  return toResponse(attendance.toObject() as LeanAttendance);
}

// ── listAttendance ────────────────────────────────────────────────────────────

export async function listAttendance(
  query: ListAttendanceQuery,
  userId: string,
  canManage: boolean,
  roleName: string
) {
  const { page, limit, eventId, studentId, status } = query;

  const filter: Record<string, unknown> = {};
  if (eventId) filter.eventId = eventId;
  if (status) filter.status = status;
  // Non-managers see only their own attendance records. Non-super-admin
  // managers see records for the events they actually manage — club staff
  // see their club's events, the event coordinator sees general events.
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
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate(ATTENDANCE_POPULATE)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanAttendance[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── updateAttendance ──────────────────────────────────────────────────────────

export async function updateAttendance(
  id: string,
  input: UpdateAttendanceBody,
  markerId: string,
  markerRole: string
) {
  const attendance = await Attendance.findById(id);
  if (!attendance) {
    throw new ApiError(
      404,
      "ATTENDANCE_NOT_FOUND",
      "Attendance record not found"
    );
  }

  const event = await Event.findById(attendance.eventId).lean();
  if (event) {
    await assertAuthorizedMarker(event, markerId, markerRole);
  }

  attendance.status = input.status;
  attendance.markedBy = new mongoose.Types.ObjectId(markerId);
  attendance.markedAt = new Date();
  await attendance.save();
  await attendance.populate(ATTENDANCE_POPULATE);

  return toResponse(attendance.toObject() as LeanAttendance);
}

// ── deleteAttendance ──────────────────────────────────────────────────────────

export async function deleteAttendance(id: string) {
  const attendance = await Attendance.findById(id);
  if (!attendance) {
    throw new ApiError(
      404,
      "ATTENDANCE_NOT_FOUND",
      "Attendance record not found"
    );
  }
  await attendance.deleteOne();
}
