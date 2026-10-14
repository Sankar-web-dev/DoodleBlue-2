/**
 * Role-name helpers shared across modules.
 *
 * SUPER_ADMIN is the hardcoded system role. EVENT COORDINATOR is a global
 * role that owns operational duties for GENERAL events (attendance,
 * certificates) — mirroring how club coordinators own CLUB events.
 * Name matching tolerates "Event Coordinator", "EVENT_COORDINATOR",
 * "event-coordinator", etc.
 */
export function isSuperAdminRole(roleName: string): boolean {
  return roleName === "SUPER_ADMIN";
}

export function isEventCoordinator(roleName: string): boolean {
  return roleName.trim().toUpperCase().replace(/[\s-]+/g, "_") ===
    "Event Coordinator";
}
