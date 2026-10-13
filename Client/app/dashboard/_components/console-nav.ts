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
};

/**
 * All sidebar navigation items. The shell filters this list with
 * `usePermissions` — an item is shown only when the user has "read"
 * access to that resource (SUPER_ADMIN sees everything).
 */
export const NAV_ITEMS: NavItem[] = [
  { id: "roles",               label: "Roles",               icon: ShieldCheck },
  { id: "users",               label: "Users",               icon: Users },
  { id: "clubs",               label: "Clubs",               icon: Building2 },
  { id: "clubMemberships",     label: "Club Memberships",    icon: UserCheck },
  { id: "events",              label: "Events",              icon: CalendarDays },
  { id: "eventRegistrations",  label: "Event Registrations", icon: ClipboardList },
  { id: "attendance",          label: "Attendance",          icon: ClipboardCheck },
  { id: "certificates",        label: "Certificates",        icon: Award },
];
