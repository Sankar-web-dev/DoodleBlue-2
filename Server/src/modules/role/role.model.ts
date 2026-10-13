import mongoose, { Schema, Document, Model } from "mongoose";

export const RESOURCES = [
  "students",
  "courses",
  "departments",
  "enrollments",
  "analytics",
  "attendance",
  "admins",
  "roles",
  "users",
] as const;

export const ACTIONS = ["create", "read", "update", "delete"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

export interface IPermission {
  resource: Resource;
  actions: Action[];
}

export interface IRole extends Document {
  name: string;
  description: string;
  permissions: IPermission[];
  isSystem: boolean;
  isActive: boolean;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const permissionSchema = new Schema<IPermission>(
  {
    resource: { type: String, enum: RESOURCES, required: true },
    actions: [{ type: String, enum: ACTIONS }],
  },
  { _id: false }
);

const roleSchema = new Schema<IRole>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    permissions: [permissionSchema],
    isSystem: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", roleSchema);

export default Role;
