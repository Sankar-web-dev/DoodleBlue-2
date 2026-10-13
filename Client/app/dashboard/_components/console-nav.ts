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
import type { AuthUser } from "@/api/auth.api";
import type { Resource } from "@/lib/permissions";

export type SectionId = Resource;

export type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof ShieldCheck;
};

const NAV_ITEMS: { id: SectionId; label: string; icon: typeof ShieldCheck }[] = [
  { id: "roles",               label: "Roles",               icon: ShieldCheck },
  { id: "users",               label: "Users",               icon: Users },
  { id: "clubs",               label: "Clubs",               icon: Building2 },
  { id: "clubMemberships",     label: "Club Memberships",    icon: UserCheck },
  { id: "events",              label: "Events",              icon: CalendarDays },
  { id: "eventRegistrations",  label: "Event Registrations", icon: ClipboardList },
  { id: "attendance",          label: "Attendance",          icon: ClipboardCheck },
  { id: "certificates",        label: "Certificates",        icon: Award },
];

/**
 * Build the sidebar navigation items based on the authenticated user.
 *
 * - SUPER_ADMIN sees every resource (implicit full access).
 * - Custom roles see an item only when they have "read" on that resource.
 */
export function getNavItems(user: AuthUser): NavItem[] {
  const has = (resource: Resource): boolean => {
    if (user.role === "SUPER_ADMIN") return true;
    return user.permissions.some(
      (p) => p.resource === resource && p.actions.includes("read")
    );
  };

  return NAV_ITEMS.filter((item) => has(item.id));
}
