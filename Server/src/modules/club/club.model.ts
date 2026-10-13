import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClub extends Document {
  name: string;
  description: string;
  department: string;
  logoUrl?: string;
  /** The single faculty coordinator who manages this club. */
  facultyCoordinatorId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clubSchema = new Schema<IClub>(
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
    department: {
      type: String,
      required: true,
      trim: true,
    },
    logoUrl: {
      type: String,
      required: false,
      trim: true,
    },
    facultyCoordinatorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Club: Model<IClub> =
  mongoose.models.Club || mongoose.model<IClub>("Club", clubSchema);

export default Club;
