/**
 * Central model registry.
 *
 * Import all Mongoose models from this single entry point to guarantee that
 * every schema is registered with Mongoose exactly once before any database
 * operation runs.
 */

export { default as User } from "../modules/auth/user.model.js";
export { default as Role } from "../modules/role/role.model.js";
export { default as Club } from "../modules/club/club.model.js";
export { default as ClubMembership } from "../modules/club-membership/club-membership.model.js";
export { default as Event } from "../modules/event/event.model.js";
export { default as EventRegistration } from "../modules/event-registration/event-registration.model.js";
export { default as Attendance } from "../modules/attendance/attendance.model.js";
export { default as Certificate } from "../modules/certificate/certificate.model.js";
