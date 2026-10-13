import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const ENROLLMENT_STATUSES = [
  "ACTIVE",
  "COMPLETED",
  "WITHDRAWN",
] as const;
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

// ─── Document interface ───────────────────────────────────────────────────────

export interface IEnrollment extends Document {
  /**
   * Student being enrolled.
   * Must be an ACTIVE student at the time of enrollment.
   * Only the reference is stored — never duplicate student data here.
   */
  studentId: mongoose.Types.ObjectId;
  /**
   * Course the student is enrolling in.
   * Must be an ACTIVE course at the time of enrollment.
   * Only the reference is stored — never duplicate course data here.
   */
  courseId: mongoose.Types.ObjectId;
  /** Timestamp of when enrollment was created. */
  enrolledAt: Date;
  status: EnrollmentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const enrollmentSchema = new Schema<IEnrollment>(
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
    enrolledAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ENROLLMENT_STATUSES,
      default: "ACTIVE",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compound unique index: a student may only be enrolled in a given course once.
 * Attempting a second enrollment returns a 11000 duplicate-key error,
 * which the service layer translates to HTTP 409 Conflict.
 */
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

// ─── Model ────────────────────────────────────────────────────────────────────

const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment ||
  mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);

export default Enrollment;
