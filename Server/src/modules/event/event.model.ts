import mongoose, { Schema, Document, Model } from "mongoose";

export const EVENT_TYPES = ["CLUB", "GENERAL"] as const;
export const EVENT_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "CANCELLED",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

/**
 * A college event — either tied to a club (CLUB, members-only) or open to
 * all eligible students (GENERAL). Club faculty create events; the Super
 * Admin approves them; students only ever see PUBLISHED events.
 */
export interface IEvent extends Document {
  title: string;
  description: string;
  eventType: EventType;
  clubId?: mongoose.Types.ObjectId;
  venue: string;
  startAt: Date;
  endAt: Date;
  registrationDeadline?: Date;
  capacity?: number;
  createdBy: mongoose.Types.ObjectId;
  status: EventStatus;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  rejectionReason?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: function (this: IEvent) {
        return this.eventType === "CLUB";
      },
      validate: {
        validator: function (this: IEvent, value: unknown) {
          // GENERAL events must not be linked to a club.
          return this.eventType === "CLUB" || value == null;
        },
        message: "General events must not be linked to a club",
      },
    },
    venue: {
      type: String,
      required: true,
      trim: true,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
      validate: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        validator: function (this: any, value: Date) {
          return !this.startAt || value > this.startAt;
        },
        message: "endAt must be after startAt",
      },
    },
    registrationDeadline: {
      type: Date,
      required: false,
    },
    capacity: {
      type: Number,
      required: false,
      min: 1,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: EVENT_STATUSES,
      required: true,
      default: "DRAFT",
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
      trim: true,
    },
    publishedAt: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

eventSchema.index({ eventType: 1, status: 1 });
eventSchema.index({ clubId: 1, status: 1 });
eventSchema.index({ startAt: 1 });

const Event: Model<IEvent> =
  mongoose.models.Event || mongoose.model<IEvent>("Event", eventSchema);

export default Event;
