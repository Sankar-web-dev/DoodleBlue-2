/**
 * Central TypeScript type definitions for the Student Management System.
 *
 * This file re-exports all enum constants and document interfaces from the
 * individual model files, and defines the API DTO types used by service and
 * route layers. Nothing here is instantiated at runtime — import as types only.
 *
 * Rule: service and controller code should import models from src/models/index.ts
 *       and types/DTOs from this file.
 */

// ─── Re-export enum constants (runtime values) ────────────────────────────────

export { RESOURCES, ACTIONS } from "../modules/role/role.model.js";
export { SYSTEM_ROLES } from "../modules/auth/user.model.js";
export { STUDENT_STATUSES } from "../modules/student/student.model.js";
export { ENROLLMENT_STATUSES } from "../modules/enrollment/enrollment.model.js";
export { ATTENDANCE_STATUSES } from "../modules/attendance/attendance.model.js";

// ─── Re-export enum types ─────────────────────────────────────────────────────

export type { Resource, Action, IPermission, IRole } from "../modules/role/role.model.js";
export type { SystemRole } from "../modules/auth/user.model.js";
export type { StudentStatus } from "../modules/student/student.model.js";
export type { EnrollmentStatus } from "../modules/enrollment/enrollment.model.js";
export type { AttendanceStatus } from "../modules/attendance/attendance.model.js";

// ─── Re-export document interfaces ───────────────────────────────────────────

export type { IUser } from "../modules/auth/user.model.js";
export type { IRole as IRoleDoc } from "../modules/role/role.model.js";
export type { IStudent } from "../modules/student/student.model.js";
export type { IDepartment } from "../modules/department/department.model.js";
export type { ICourse } from "../modules/course/course.model.js";
export type { IEnrollment } from "../modules/enrollment/enrollment.model.js";
export type { IAttendance } from "../modules/attendance/attendance.model.js";

// ─── Imported types used in DTOs below ───────────────────────────────────────

import type { StudentStatus } from "../modules/student/student.model.js";
import type { AttendanceStatus } from "../modules/attendance/attendance.model.js";

// ─── Input DTOs ───────────────────────────────────────────────────────────────

/**
 * Input required to create a Student together with a linked User account.
 *
 * The service layer must:
 *  1. Hash `password` with bcrypt before writing User.passwordHash.
 *  2. Start a MongoDB transaction (or implement rollback) so that a failure
 *     after User creation does not leave an orphan User without a Student.
 *  3. Write identical lowercase-trimmed email to both User.email and Student.email.
 */
export interface CreateStudentInput {
  /** Stored on User.name. */
  name: string;
  /** Stored lowercase-trimmed on User.email AND Student.email. */
  email: string;
  /** Plain-text — hashed to bcrypt before storage; never persisted as-is. */
  password: string;
  /** Unique institutional identifier, e.g. "STU-2024-0001". */
  studentNumber: string;
  /** Student display name stored on Student.fullName. */
  fullName: string;
  phone?: string;
  /** 24-char hex ObjectId string; validated server-side before DB write. */
  departmentId: string;
  admissionDate?: Date;
}

/**
 * Fields an admin may update on a Student record.
 *
 * Note: email and studentNumber are not updatable through this DTO.
 * Email changes must update both User.email and Student.email atomically.
 */
export interface UpdateStudentInput {
  fullName?: string;
  phone?: string;
  /** 24-char hex ObjectId string; validated server-side. */
  departmentId?: string;
  admissionDate?: Date;
  status?: StudentStatus;
}

/** Input to create a new Department. */
export interface CreateDepartmentInput {
  name: string;
  /** Normalised to uppercase before storage. */
  code: string;
}

/** Fields an admin may update on a Department. */
export interface UpdateDepartmentInput {
  name?: string;
  isActive?: boolean;
}

/**
 * Input to create a new Course.
 * The service layer must verify that the referenced Department is ACTIVE.
 */
export interface CreateCourseInput {
  name: string;
  /** Normalised to uppercase before storage. */
  code: string;
  description?: string;
  /** 24-char hex ObjectId string; must reference an active Department. */
  departmentId: string;
}

/** Fields an admin may update on a Course. */
export interface UpdateCourseInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Input to enroll a student in a course.
 * The service layer must verify:
 *  - studentId references an ACTIVE student.
 *  - courseId references an ACTIVE course.
 *  - No ACTIVE enrollment already exists for (studentId, courseId).
 */
export interface CreateEnrollmentInput {
  /** 24-char hex ObjectId string referencing an ACTIVE Student. */
  studentId: string;
  /** 24-char hex ObjectId string referencing an ACTIVE Course. */
  courseId: string;
}

/**
 * Input to record attendance for a student in a course session.
 *
 * The service layer must:
 *  - Validate that an ACTIVE Enrollment exists for (studentId, courseId).
 *  - Derive `recordedBy` from req.session.userId — never from client input.
 *  - Normalise sessionDate to midnight UTC before saving.
 */
export interface CreateAttendanceInput {
  /** 24-char hex ObjectId string. */
  studentId: string;
  /** 24-char hex ObjectId string. */
  courseId: string;
  /**
   * The calendar date of the session.
   * The service layer must zero the time component to midnight UTC so that
   * the compound unique index correctly enforces one record per calendar day.
   */
  sessionDate: Date;
  status: AttendanceStatus;
  note?: string;
}

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
  /** Populated only for student role accounts. */
  studentId?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
