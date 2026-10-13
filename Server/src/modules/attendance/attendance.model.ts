import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

// ─── Document interface ───────────────────────────────────────────────────────

export interface IAttendance extends Document {
  /**
   * Student whose attendance is being recorded.
   * Must have an ACTIVE enrollment in the given course before recording.
   */
  studentId: mongoose.Types.ObjectId;
  /**
   * Course session the attendance belongs to.
   * Only the reference is stored — never duplicate course data here.
   */
  courseId: mongoose.Types.ObjectId;
  /**
   * Calendar date of the session.
   * Stored as a UTC date with the time component zeroed out so that
   * the compound unique index enforces one record per (student, course, day).
   *
   * Normalise to midnight UTC before saving:
   *   const d = new Date(rawDate); d.setUTCHours(0, 0, 0, 0);
   */
  sessionDate: Date;
  status: AttendanceStatus;
  /**
   * The authenticated Admin or Super-Admin User who recorded this entry.
   * Always derived from req.session on the server — never accepted from the client.
   */
  recordedBy: mongoose.Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const attendanceSchema = new Schema<IAttendance>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: one attendance record per student per course per day.
 * Attempting a duplicate returns a 11000 error → HTTP 409 Conflict.
 */
attendanceSchema.index(
  { studentId: 1, courseId: 1, sessionDate: 1 },
  { unique: true }
);

// Secondary indexes for common read patterns
attendanceSchema.index({ courseId: 1, sessionDate: 1 });
attendanceSchema.index({ sessionDate: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
