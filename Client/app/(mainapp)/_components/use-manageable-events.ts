"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import type { AuthUser } from "@/api/auth.api";
import {
  clubMembershipsApi,
  MY_MEMBERSHIPS_KEY,
} from "@/api/club-memberships.api";
import { isEventCoordinatorRole } from "@/lib/permissions";
import { useEvents } from "../events/_hooks/use-events";
import { useClubs } from "../club-membership/_hooks/use-memberships";

/**
 * Events the user can manage operationally (mark attendance, request
 * certificates):
 *
 * - SUPER_ADMIN → every published event
 * - EVENT COORDINATOR role → GENERAL events only
 * - Club staff → CLUB events of clubs they coordinate (ACTIVE coordinator
 *   membership) or faculty-coordinate (their own clubs)
 * - Everyone else → none
 *
 * Mirrors the server-side rules in `managedEventIds` / `assertAuthorizedMarker`.
 */
export function useManageableEvents(user: AuthUser | null) {
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isEventCoord = isEventCoordinatorRole(user?.role);

  const eventsQuery = useEvents({ status: "PUBLISHED" });
  const myMemberships = useQuery({
    queryKey: MY_MEMBERSHIPS_KEY,
    queryFn: clubMembershipsApi.listMyMemberships,
    enabled: !!user && !isSuperAdmin && !isEventCoord,
    staleTime: 60_000,
  });
  const clubsQuery = useClubs();

  const events = useMemo(() => {
    const all = eventsQuery.data?.data ?? [];
    if (isSuperAdmin) return all;
    if (isEventCoord) return all.filter((e) => e.eventType === "GENERAL");

    const coordClubIds = new Set(
      (myMemberships.data ?? [])
        .filter(
          (m) => m.status === "ACTIVE" && m.membershipRole === "COORDINATOR"
        )
        .map((m) => m.clubId)
    );
    const facultyClubIds = new Set(
      (clubsQuery.data?.data ?? [])
        .filter((c) => c.facultyCoordinatorId === user?.id)
        .map((c) => c.id)
    );

    return all.filter(
      (e) =>
        e.eventType === "CLUB" &&
        e.clubId != null &&
        (coordClubIds.has(e.clubId) || facultyClubIds.has(e.clubId))
    );
  }, [
    eventsQuery.data,
    isSuperAdmin,
    isEventCoord,
    myMemberships.data,
    clubsQuery.data,
    user?.id,
  ]);

  // Membership/club lookups only gate club-staff visibility; an event
  // coordinator or super admin never waits on them.
  const isPending =
    eventsQuery.isPending ||
    (!isSuperAdmin && !isEventCoord && myMemberships.isPending);

  return {
    events,
    isPending,
    error: eventsQuery.error,
    refetch: eventsQuery.refetch,
  };
}
