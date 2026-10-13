import mongoose, { Schema, Document, Model } from "mongoose";

// SUPER_ADMIN is the only hardcoded system role.
// All other roles are stored in the Role collection and referenced by roleId.
export const SYSTEM_ROLES = ["SUPER_ADMIN"] as const;
export type SystemRole = (typeof SYSTEM_ROLES)[number];

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  /** Role name — "SUPER_ADMIN" for the system account, otherwise the Role document's name. */
  role: string;
  /** References the Role document. Not set for SUPER_ADMIN. */
  roleId?: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: false,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: false,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
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

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>("User", userSchema);

export default User;
