import mongoose from "mongoose";
import Attendance from "./attendance.model";
import Enrollment from "../enrollment/enrollment.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateAttendanceBody,
  UpdateAttendanceBody,
  ListAttendanceQuery,
} from "./attendance.validation";

// ─── Lean document shapes ─────────────────────────────────────────────────────

interface StudentRef {
  _id: mongoose.Types.ObjectId;
  studentNumber: string;
  fullName: string;
}

interface CourseRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface RecorderRef {
  _id: mongoose.Types.ObjectId;
  name: string;
}

interface PopulatedAttendance {
  _id: mongoose.Types.ObjectId;
  studentId: StudentRef;
  courseId: CourseRef;
  sessionDate: Date;
  status: string;
  recordedBy: RecorderRef;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe attendance payload — references resolved via populate. */
function toResponse(doc: PopulatedAttendance) {
  return {
    id: doc._id.toString(),
    student: {
      id: doc.studentId._id.toString(),
      studentNumber: doc.studentId.studentNumber,
      fullName: doc.studentId.fullName,
    },
    course: {
      id: doc.courseId._id.toString(),
      name: doc.courseId.name,
      code: doc.courseId.code,
    },
    sessionDate: doc.sessionDate,
    status: doc.status,
    recordedBy: {
      id: doc.recordedBy._id.toString(),
      name: doc.recordedBy.name,
    },
    note: doc.note,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/** Normalise to midnight UTC so the unique index enforces one record per day. */
function toUtcMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const POPULATE = [
  { path: "studentId", select: "studentNumber fullName" },
  { path: "courseId", select: "name code" },
  { path: "recordedBy", select: "name" },
];

async function fetchPopulated(id: string | mongoose.Types.ObjectId) {
  const doc = await Attendance.findById(id)
    .populate(POPULATE[0])
    .populate(POPULATE[1])
    .populate(POPULATE[2])
    .lean();

  if (!doc) {
    throw new ApiError(404, "ATTENDANCE_NOT_FOUND", "Attendance record not found");
  }

  return toResponse(doc as unknown as PopulatedAttendance);
}

// ─── recordAttendance ─────────────────────────────────────────────────────────

export async function recordAttendance(
  input: CreateAttendanceBody,
  recordedBy: mongoose.Types.ObjectId | string
) {
  // The student must hold an ACTIVE enrollment in the course before any
  // attendance can be recorded for them.
  const enrolled = await Enrollment.exists({
    studentId: input.studentId,
    courseId: input.courseId,
    status: "ACTIVE",
  });

  if (!enrolled) {
    throw new ApiError(
      400,
      "NOT_ENROLLED",
      "Student does not have an active enrollment in this course"
    );
  }

  const sessionDate = toUtcMidnight(input.sessionDate);

  const existing = await Attendance.exists({
    studentId: input.studentId,
    courseId: input.courseId,
    sessionDate,
  });
  if (existing) {
    throw new ApiError(
      409,
      "ATTENDANCE_EXISTS",
      "Attendance already recorded for this student, course and date"
    );
  }

  const doc = await Attendance.create({
    studentId: input.studentId,
    courseId: input.courseId,
    sessionDate,
    status: input.status,
    note: input.note,
    recordedBy,
  });

  return fetchPopulated(doc._id as mongoose.Types.ObjectId);
}

// ─── listAttendance ───────────────────────────────────────────────────────────

export async function listAttendance(query: ListAttendanceQuery) {
  const { page, limit, studentId, courseId, status, from, to } = query;

  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (courseId) filter.courseId = courseId;
  if (status) filter.status = status;

  if (from || to) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (from) range.$gte = toUtcMidnight(from);
    if (to) {
      const end = toUtcMidnight(to);
      end.setUTCDate(end.getUTCDate() + 1); // inclusive end date
      range.$lte = end;
    }
    filter.sessionDate = range;
  }

  const [total, docs] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate(POPULATE[0])
      .populate(POPULATE[1])
      .populate(POPULATE[2])
      .sort({ sessionDate: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as PopulatedAttendance[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getAttendanceById ────────────────────────────────────────────────────────

export async function getAttendanceById(id: string) {
  return fetchPopulated(id);
}

// ─── updateAttendance ─────────────────────────────────────────────────────────

export async function updateAttendance(
  id: string,
  input: UpdateAttendanceBody
) {
  const set: Record<string, unknown> = {};
  if (input.status !== undefined) set.status = input.status;
  if (input.note !== undefined) set.note = input.note;

  const doc = await Attendance.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  )
    .populate(POPULATE[0])
    .populate(POPULATE[1])
    .populate(POPULATE[2])
    .lean();

  if (!doc) {
    throw new ApiError(404, "ATTENDANCE_NOT_FOUND", "Attendance record not found");
  }

  return toResponse(doc as unknown as PopulatedAttendance);
}

// ─── deleteAttendance ─────────────────────────────────────────────────────────

export async function deleteAttendance(id: string): Promise<void> {
  const deleted = await Attendance.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "ATTENDANCE_NOT_FOUND", "Attendance record not found");
  }
}
