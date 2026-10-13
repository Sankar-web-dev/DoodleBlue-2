/**
 * Central model registry.
 *
 * Import all Mongoose models from this single entry point to guarantee that
 * every schema is registered with Mongoose exactly once before any database
 * operation runs.
 */

export { default as User } from "../modules/auth/user.model.js";
export { default as Role } from "../modules/role/role.model.js";
