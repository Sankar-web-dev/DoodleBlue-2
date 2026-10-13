import mongoose, { Schema, Document, Model } from "mongoose";

export const MEMBERSHIP_ROLES = ["MEMBER", "COORDINATOR"] as const;
export const MEMBERSHIP_STATUSES = ["ACTIVE", "INACTIVE"] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

/**
 * Records a student's relationship with a specific club — plain membership
 * or student-coordinator responsibility. Not part of RBAC.
 *
 * Invariants enforced at the service layer:
 *  - at most one ACTIVE coordinator per club;
 *  - a coordinator must be an ACTIVE member of that club;
 *  - changing coordinators demotes the old one to MEMBER.
 */
export interface IClubMembership extends Document {
  clubId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  membershipRole: MembershipRole;
  status: MembershipStatus;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const clubMembershipSchema = new Schema<IClubMembership>(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    membershipRole: {
      type: String,
      enum: MEMBERSHIP_ROLES,
      required: true,
      default: "MEMBER",
    },
    status: {
      type: String,
      enum: MEMBERSHIP_STATUSES,
      required: true,
      default: "ACTIVE",
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One membership record per student per club.
clubMembershipSchema.index({ clubId: 1, studentId: 1 }, { unique: true });
// Fast lookup of a club's active coordinator.
clubMembershipSchema.index(
  { clubId: 1, membershipRole: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      membershipRole: "COORDINATOR",
      status: "ACTIVE",
    },
  }
);

const ClubMembership: Model<IClubMembership> =
  mongoose.models.ClubMembership ||
  mongoose.model<IClubMembership>("ClubMembership", clubMembershipSchema);

export default ClubMembership;
