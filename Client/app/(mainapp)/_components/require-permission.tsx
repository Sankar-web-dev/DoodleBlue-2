"use client";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions, type Resource, type Action } from "@/lib/permissions";
import { ForbiddenState } from "./forbidden-state";

/**
 * Page-level permission gate. Renders children only when the current user
 * has the required permission on the resource (default: "read").
 * Backend `authorize()` remains the real security boundary.
 */
export function RequirePermission({
  resource,
  action = "read",
  message,
  children,
}: {
  resource: Resource;
  action?: Action;
  message?: string;
  children: React.ReactNode;
}) {
  const { user, isPending } = useAuthUser();
  const { can } = usePermissions(user);

  if (isPending) return null;
  if (!can(resource, action)) return <ForbiddenState message={message} />;

  return <>{children}</>;
}
