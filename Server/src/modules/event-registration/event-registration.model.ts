import mongoose, { Schema, Document, Model } from "mongoose";

export const REGISTRATION_STATUSES = [
  "REGISTERED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/**
 * A student's registration for an event plus the club coordinator's decision.
 *
 * General events use automatic registration (status set at creation).
 * Club events start PENDING and are reviewed by the club's student
 * coordinator (reviewedBy / reviewedAt / rejectionReason).
 */
export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  status: RegistrationStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventRegistrationSchema = new Schema<IEventRegistration>(
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
    status: {
      type: String,
      enum: REGISTRATION_STATUSES,
      required: true,
      default: "PENDING",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reviewedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
      trim: true,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// A student can register for an event only once.
eventRegistrationSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1, status: 1 });
eventRegistrationSchema.index({ studentId: 1, status: 1 });

const EventRegistration: Model<IEventRegistration> =
  mongoose.models.EventRegistration ||
  mongoose.model<IEventRegistration>(
    "EventRegistration",
    eventRegistrationSchema
  );

export default EventRegistration;
