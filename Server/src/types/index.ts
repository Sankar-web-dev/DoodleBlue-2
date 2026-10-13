/**
 * Central TypeScript type definitions.
 *
 * Re-exports enum constants and document interfaces from the model files.
 * Nothing here is instantiated at runtime — import as types only.
 */

// ─── Re-export enum constants (runtime values) ────────────────────────────────

export { RESOURCES, ACTIONS } from "../modules/role/role.model.js";
export { SYSTEM_ROLES } from "../modules/auth/user.model.js";

// ─── Re-export types ──────────────────────────────────────────────────────────

export type { Resource, Action, IPermission, IRole } from "../modules/role/role.model.js";
export type { SystemRole, IUser } from "../modules/auth/user.model.js";

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
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
