import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Enum ─────────────────────────────────────────────────────────────────────

export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

// ─── Document interface ───────────────────────────────────────────────────────

export interface IStudent extends Document {
  /**
   * Reference to the User account that owns this student profile.
   * One-to-one: each student has exactly one linked User.
   */
  userId: mongoose.Types.ObjectId;
  /** Institutional student number, e.g. "STU-2024-0001". Unique. */
  studentNumber: string;
  /** Student's full display name. */
  fullName: string;
  /**
   * Student contact email. Retained per specification.
   * Must remain in sync with User.email — update both atomically.
   */
  email: string;
  phone?: string;
  /** Department the student belongs to. */
  departmentId: mongoose.Types.ObjectId;
  admissionDate?: Date;
  status: StudentStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    admissionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: STUDENT_STATUSES,
      default: "ACTIVE",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common query patterns beyond the declared unique indexes above
studentSchema.index({ departmentId: 1 });
studentSchema.index({ status: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Student: Model<IStudent> =
  mongoose.models.Student ||
  mongoose.model<IStudent>("Student", studentSchema);

export default Student;
