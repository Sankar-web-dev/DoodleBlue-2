import {
  BookOpen,
  Building2,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import type { AuthUser } from "@/api/auth.api";

export type SectionId =
  | "overview"
  | "roles"
  | "admins"
  | "students"
  | "departments"
  | "courses";

export type NavItem = {
  id: SectionId;
  label: string;
  icon: typeof Building2;
};

/**
 * Build the sidebar navigation items based on the authenticated user.
 *
 * - SUPER_ADMIN always sees Roles and Admins management.
 * - All other users see items only for resources they have at least "read" access to.
 * - Overview (analytics) is shown to everyone who uses the admin shell.
 */
export function getNavItems(user: AuthUser): NavItem[] {
  const isSuper = user.role === "SUPER_ADMIN";

  const has = (resource: string): boolean => {
    if (isSuper) return true;
    return user.permissions.some(
      (p) => p.resource === resource && p.actions.includes("read")
    );
  };

  const items: NavItem[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
  ];

  if (isSuper) {
    items.push({ id: "roles",  label: "Roles",  icon: ShieldCheck });
  }

  if (has("admins"))      items.push({ id: "admins",      label: "Admins",      icon: UserCog });
  if (has("students"))    items.push({ id: "students",    label: "Students",    icon: GraduationCap });
  if (has("departments")) items.push({ id: "departments", label: "Departments", icon: Building2 });
  if (has("courses"))     items.push({ id: "courses",     label: "Courses",     icon: BookOpen });

  return items;
}
