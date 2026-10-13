import mongoose, { Schema, Document, Model } from "mongoose";

export const CERTIFICATE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ISSUED",
] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

/**
 * A participation certificate for an event.
 *
 * Flow: the club student coordinator requests it (PENDING) → the club
 * faculty coordinator approves or rejects → on issue, a unique
 * certificateNumber is generated and issuedAt is stamped.
 *
 * Eligibility (enforced at the service layer): the student must hold an
 * APPROVED registration and a PRESENT attendance record for the event.
 */
export interface ICertificate extends Document {
  eventId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  issuedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  status: CertificateStatus;
  certificateNumber?: string;
  certificateUrl?: string;
  approvedAt?: Date;
  issuedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<ICertificate>(
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
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    status: {
      type: String,
      enum: CERTIFICATE_STATUSES,
      required: true,
      default: "PENDING",
    },
    certificateNumber: {
      type: String,
      required: false,
      trim: true,
    },
    certificateUrl: {
      type: String,
      required: false,
      trim: true,
    },
    approvedAt: {
      type: Date,
      required: false,
    },
    issuedAt: {
      type: Date,
      required: false,
    },
    rejectionReason: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

// One certificate per student per event.
certificateSchema.index({ eventId: 1, studentId: 1 }, { unique: true });
// certificateNumber is unique only once assigned (on issue).
certificateSchema.index(
  { certificateNumber: 1 },
  { unique: true, sparse: true }
);
certificateSchema.index({ status: 1 });

const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ||
  mongoose.model<ICertificate>("Certificate", certificateSchema);

export default Certificate;
