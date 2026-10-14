"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AuthUser } from "@/api/auth.api";
import {
  clubMembershipsApi,
  MY_MEMBERSHIPS_KEY,
} from "@/api/club-memberships.api";
import { usePermissions } from "@/lib/permissions";
import { NAV_ITEMS, type NavItem } from "./console-nav";

/**
 * Sidebar nav visibility.
 *
 * Every gated item requires "read" on its resource. Items flagged
 * `requiresCoordinator` (Attendance, Certificates) are additionally hidden
 * from plain club members — users whose memberships are all MEMBER with no
 * ACTIVE coordinator role. Faculty and admins have no club memberships, so
 * permission alone decides for them; SUPER_ADMIN always sees everything.
 */
export function useConsoleNav(user: AuthUser | null): NavItem[] {
  const { can } = usePermissions(user);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const myMemberships = useQuery({
    queryKey: MY_MEMBERSHIPS_KEY,
    queryFn: clubMembershipsApi.listMyMemberships,
    enabled: !!user && !isSuperAdmin,
    staleTime: 60_000,
  });

  const isMemberOnly = useMemo(() => {
    const memberships = myMemberships.data ?? [];
    // No memberships at all → not a club member (faculty / normal users).
    if (memberships.length === 0) return false;
    return !memberships.some(
      (m) => m.status === "ACTIVE" && m.membershipRole === "COORDINATOR"
    );
  }, [myMemberships.data]);

  return useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (item.resource && !can(item.resource, "read")) return false;
        if (item.requiresCoordinator && !isSuperAdmin) {
          // Hide until membership data resolves — a member should never see
          // the item flash and disappear.
          if (myMemberships.isPending) return false;
          if (isMemberOnly) return false;
        }
        return true;
      }),
    [can, isSuperAdmin, isMemberOnly, myMemberships.isPending]
  );
}
