import mongoose, { Schema, Document, Model } from "mongoose";

// ─── Document interface ───────────────────────────────────────────────────────

export interface IDepartment extends Document {
  /** Human-readable department name, e.g. "Computer Science". */
  name: string;
  /**
   * Short unique identifier for the department, e.g. "CS".
   * Stored uppercase; validated/normalised at the service layer.
   */
  code: string;
  /**
   * Soft-delete flag. Deactivated departments retain all related
   * Student and Course records — only new associations are blocked.
   */
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const departmentSchema = new Schema<IDepartment>(
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
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// The unique index on `code` is declared via the schema field option above.
// An additional partial-filter index is not added here because the spec
// requires the code to remain globally unique even for inactive departments
// (avoids re-using the same code for a different department later).

// ─── Model ────────────────────────────────────────────────────────────────────

const Department: Model<IDepartment> =
  mongoose.models.Department ||
  mongoose.model<IDepartment>("Department", departmentSchema);

export default Department;
