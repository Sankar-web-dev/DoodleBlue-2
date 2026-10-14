import {
  Award,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { Resource } from "@/lib/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof ShieldCheck;
  /**
   * Permission resource gating this nav item — the user needs "read" on it.
   * Omit for items every authenticated user can see (e.g. Dashboard).
   */
  resource?: Resource;
  /**
   * Additionally hidden from plain club members — only users with an ACTIVE
   * coordinator membership (or no club membership at all, e.g. faculty and
   * admins) see these items. SUPER_ADMIN always sees them.
   */
  requiresCoordinator?: boolean;
  /** Visible only to SUPER_ADMIN, regardless of role permissions. */
  superAdminOnly?: boolean;
};

/**
 * All sidebar navigation items. The shell filters this list with
 * `usePermissions` — gated items are shown only when the user has "read"
 * access to that resource (SUPER_ADMIN sees everything).
 */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",           label: "Dashboard",           icon: LayoutDashboard },
  { href: "/roles",               label: "Roles",               icon: ShieldCheck,    resource: "roles", superAdminOnly: true },
  { href: "/users",               label: "Users",               icon: Users,          resource: "users", superAdminOnly: true },
  { href: "/clubs",               label: "Clubs",               icon: Building2,      resource: "clubs" },
  { href: "/club-membership",     label: "Club Memberships",    icon: UserCheck,      resource: "clubMemberships" },
  { href: "/events",              label: "Events",              icon: CalendarDays,   resource: "events" },
  { href: "/event-registration",  label: "Event Registrations", icon: ClipboardList,  resource: "eventRegistrations" },
  { href: "/attendances",         label: "Attendance",          icon: ClipboardCheck, resource: "attendance",   requiresCoordinator: true },
  { href: "/certificates",        label: "Certificates",        icon: Award,          resource: "certificates", requiresCoordinator: true },
];
