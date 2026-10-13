"use client";

import { AdminConsole } from "../admin-console";
import { StudentsConsole } from "../students-console";
import { DepartmentsConsole } from "../departments-console";
import { CoursesConsole } from "../courses-console";
import { AnalyticsConsole } from "../analytics-console";
import { RolesConsole } from "../roles-console";
import type { AuthUser } from "@/api/auth.api";
import type { SectionId } from "./console-nav";

export function SectionContent({
  section,
  user,
}: {
  section: SectionId;
  user: AuthUser;
}) {
  const isSuper = user.role === "SUPER_ADMIN";

  switch (section) {
    case "overview":
      return <AnalyticsConsole isSuper={isSuper} />;
    case "roles":
      return <RolesConsole />;
    case "admins":
      return <AdminConsole user={user} />;
    case "students":
      return <StudentsConsole user={user} />;
    case "departments":
      return <DepartmentsConsole user={user} />;
    default:
      return <CoursesConsole user={user} />;
  }
}
