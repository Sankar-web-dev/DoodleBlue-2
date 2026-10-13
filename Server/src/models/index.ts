/**
 * Central model registry for the Student Management System.
 *
 * Import all Mongoose models from this single entry point to guarantee that
 * every schema is registered with Mongoose exactly once before any database
 * operation runs.
 *
 * Usage in service or route files:
 *   import { User, Student, Department, Course, Enrollment, Attendance } from "../../models/index.js";
 */

export { default as User } from "../modules/auth/user.model.js";
export { default as Student } from "../modules/student/student.model.js";
export { default as Department } from "../modules/department/department.model.js";
export { default as Course } from "../modules/course/course.model.js";
export { default as Enrollment } from "../modules/enrollment/enrollment.model.js";
export { default as Attendance } from "../modules/attendance/attendance.model.js";
