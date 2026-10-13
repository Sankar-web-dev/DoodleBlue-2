/**
 * Frontend API client modules.
 *
 * All business logic, database queries, and role authorization reside on the Server (Express/MongoDB).
 * This layer handles client-side HTTP communication with the /api/v1 endpoints.
 */

export * from "./auth.api";
export * from "./courses.api";
export * from "./departments.api";
export * from "./enrollments.api";
export * from "./students.api";
export * from "./users.api";
export * from "./analytics.api";
export * from "./attendance.api";
export * from "./me.api";
