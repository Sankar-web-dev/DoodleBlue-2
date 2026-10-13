import {
  Award,
  Building2,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import type { Resource } from "@/lib/permissions";

export type SectionId = Resource;

export type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof ShieldCheck;
  href: string;
};

/**
 * All sidebar navigation items. The shell filters this list with
 * `usePermissions` — an item is shown only when the user has "read"
 * access to that resource (SUPER_ADMIN sees everything).
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "roles",              label: "Roles",               icon: ShieldCheck,    href: "/dashboard/roles" },
  { id: "users",              label: "Users",               icon: Users,          href: "/dashboard/users" },
  { id: "clubs",              label: "Clubs",               icon: Building2,      href: "/dashboard/clubs" },
  { id: "clubMemberships",    label: "Club Memberships",    icon: UserCheck,      href: "/dashboard/club-membership" },
  { id: "events",             label: "Events",              icon: CalendarDays,   href: "/dashboard/events" },
  { id: "eventRegistrations", label: "Event Registrations", icon: ClipboardList,  href: "/dashboard/event-registration" },
  { id: "attendance",         label: "Attendance",          icon: ClipboardCheck, href: "/dashboard/attendances" },
  { id: "certificates",       label: "Certificates",        icon: Award,          href: "/dashboard/certificates" },
];
