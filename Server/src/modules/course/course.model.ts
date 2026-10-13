import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Document interface ───────────────────────────────────────────────────────

export interface ICourse extends Document {
  /** Course title, e.g. "Introduction to Algorithms". */
  name: string;
  /**
   * Short unique course code, e.g. "CS101".
   * Stored uppercase; validated/normalised at the service layer.
   */
  code: string;
  description?: string;
  /**
   * The department this course belongs to.
   * Must reference an existing, active Department when the course is created.
   * Department details are never duplicated here — populate when needed.
   */
  departmentId: mongoose.Types.ObjectId;
  /**
   * Soft-delete flag. Inactive courses cannot accept new enrollments
   * but retain existing enrollment and attendance records.
   */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const courseSchema = new Schema<ICourse>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching courses by department
courseSchema.index({ departmentId: 1 });

// ─── Model ────────────────────────────────────────────────────────────────────

const Course: Model<ICourse> =
  mongoose.models.Course ||
  mongoose.model<ICourse>("Course", courseSchema);

export default Course;
