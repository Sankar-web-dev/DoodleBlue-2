import mongoose, { Schema, Document, Model } from "mongoose";

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/**
 * Attendance for an approved event participant, marked by an authorized
 * coordinator. For club events the student must hold an APPROVED
 * EventRegistration before attendance can be recorded.
 */
export interface IAttendance extends Document {
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  markedBy: mongoose.Types.ObjectId;
  status: AttendanceStatus;
  markedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    markedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ATTENDANCE_STATUSES,
      required: true,
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One attendance record per student per event.
attendanceSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
attendanceSchema.index({ eventId: 1, status: 1 });

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", attendanceSchema);

export default Attendance;
