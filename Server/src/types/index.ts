/**
 * Central TypeScript type definitions.
 *
 * Re-exports enum constants and document interfaces from the model files.
 * Nothing here is instantiated at runtime — import as types only.
 */

// ─── Re-export enum constants (runtime values) ────────────────────────────────

export { RESOURCES, ACTIONS } from "../modules/role/role.model.js";
export { SYSTEM_ROLES } from "../modules/auth/user.model.js";
export {
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
} from "../modules/club-membership/club-membership.model.js";
export { EVENT_TYPES, EVENT_STATUSES } from "../modules/event/event.model.js";
export { REGISTRATION_STATUSES } from "../modules/event-registration/event-registration.model.js";
export { ATTENDANCE_STATUSES } from "../modules/attendance/attendance.model.js";
export { CERTIFICATE_STATUSES } from "../modules/certificate/certificate.model.js";

// ─── Re-export types ──────────────────────────────────────────────────────────

export type { Resource, Action, IPermission, IRole } from "../modules/role/role.model.js";
export type { SystemRole, IUser } from "../modules/auth/user.model.js";
export type { IClub } from "../modules/club/club.model.js";
export type {
  IClubMembership,
  MembershipRole,
  MembershipStatus,
} from "../modules/club-membership/club-membership.model.js";
export type { IEvent, EventType, EventStatus } from "../modules/event/event.model.js";
export type {
  IEventRegistration,
  RegistrationStatus,
} from "../modules/event-registration/event-registration.model.js";
export type { IAttendance, AttendanceStatus } from "../modules/attendance/attendance.model.js";
export type {
  ICertificate,
  CertificateStatus,
} from "../modules/certificate/certificate.model.js";

// ─── Safe API response types ─────────────────────────────────────────────────

/**
 * Safe representation of a User sent to clients.
 * Never includes passwordHash, session internals, or bcrypt salts.
 */
export interface SafeUserResponse {
  id: string;
  name: string;
  email: string;
  /** Role name string — "SUPER_ADMIN" or the Role document's name. */
  role: string;
  roleId?: string;
  image?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
