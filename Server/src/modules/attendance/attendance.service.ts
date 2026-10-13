import mongoose from "mongoose";
import Attendance from "./attendance.model";
import Event from "../event/event.model";
import Club from "../club/club.model";
import EventRegistration from "../event-registration/event-registration.model";
import { isActiveCoordinator } from "../club-membership/club-membership.service";
import { ApiError } from "../../lib/ApiError";
import type {
  MarkAttendanceBody,
  UpdateAttendanceBody,
  ListAttendanceQuery,
} from "./attendance.validation";

// ── Response shape ────────────────────────────────────────────────────────────

interface LeanAttendance {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  markedBy: mongoose.Types.ObjectId;
  status: string;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

function toResponse(doc: LeanAttendance) {
  return {
    id: doc._id.toString(),
    eventId: doc.eventId.toString(),
    studentId: doc.studentId.toString(),
    markedBy: doc.markedBy.toString(),
    status: doc.status,
    markedAt: doc.markedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * For club events, the marker must be the club's faculty coordinator, an
 * active student coordinator, or SUPER_ADMIN. General events rely on the
 * route-level attendance:create permission.
 */
async function assertAuthorizedMarker(
  event: { eventType: string; clubId?: mongoose.Types.ObjectId },
  markerId: string,
  isSuperAdmin: boolean
): Promise<void> {
  if (event.eventType !== "CLUB" || isSuperAdmin) return;

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
  isSuperAdmin: boolean
) {
  const event = await Event.findById(input.eventId).lean();
  if (!event) {
    throw new ApiError(404, "EVENT_NOT_FOUND", "Event not found");
  }

  await assertAuthorizedMarker(event, markerId, isSuperAdmin);

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

  return toResponse(attendance.toObject() as LeanAttendance);
}

// ── listAttendance ────────────────────────────────────────────────────────────

export async function listAttendance(
  query: ListAttendanceQuery,
  userId: string,
  canManage: boolean
) {
  const { page, limit, eventId, studentId, status } = query;

  const filter: Record<string, unknown> = {};
  if (eventId) filter.eventId = eventId;
  if (status) filter.status = status;
  // Non-managers can only see their own attendance records.
  if (!canManage) filter.studentId = userId;
  else if (studentId) filter.studentId = studentId;

  const [total, docs] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
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
  isSuperAdmin: boolean
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
    await assertAuthorizedMarker(event, markerId, isSuperAdmin);
  }

  attendance.status = input.status;
  attendance.markedBy = new mongoose.Types.ObjectId(markerId);
  attendance.markedAt = new Date();
  await attendance.save();

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
