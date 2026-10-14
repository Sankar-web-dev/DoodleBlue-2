/**
 * Frontend API client modules.
 *
 * All business logic, database queries, and role authorization reside on the Server (Express/MongoDB).
 * This layer handles client-side HTTP communication with the /api/v1 endpoints.
 */

export * from "./auth.api";
export * from "./roles.api";
export * from "./users.api";
