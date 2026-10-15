import { useQuery } from "@tanstack/react-query";
import { usersApi } from "@/api/users.api";
import { rolesApi } from "@/api/roles.api";
import { clubsApi } from "@/api/clubs.api";
import { clubMembershipsApi } from "@/api/club-memberships.api";
import type { MembershipStatus } from "@/api/club-memberships.api";
import { eventsApi, EVENT_STATUSES } from "@/api/events.api";
import type { EventItem, EventStatus } from "@/api/events.api";
import {
  eventRegistrationsApi,
  REGISTRATION_STATUSES,
} from "@/api/event-registrations.api";
import type {
  EventRegistration,
  RegistrationStatus,
} from "@/api/event-registrations.api";
import { attendanceApi, ATTENDANCE_STATUSES } from "@/api/attendance.api";
import type { AttendanceStatus } from "@/api/attendance.api";
import { certificatesApi, CERTIFICATE_STATUSES } from "@/api/certificates.api";
import type { CertificateStatus } from "@/api/certificates.api";

export interface DashboardStats {
  totals: {
    users: number;
    roles: number;
    clubs: number;
    activeClubs: number;
    memberships: number;
    events: number;
    registrations: number;
    attendance: number;
    certificates: number;
  };
  /** Counts awaiting an admin/faculty decision. */
  pending: {
    events: number;
    registrations: number;
    memberships: number;
    certificates: number;
  };
  eventsByStatus: Record<EventStatus, number>;
  certificatesByStatus: Record<CertificateStatus, number>;
  registrationsByStatus: Record<RegistrationStatus, number>;
  membershipsByStatus: Record<MembershipStatus, number>;
  attendanceByStatus: Record<AttendanceStatus, number>;
  /** User count grouped by role name. */
  usersByRole: { role: string; count: number }[];
  /** Registrations per day for the last 7 days (oldest → newest). */
  registrationTrend: { date: string; label: string; count: number }[];
  /** Records created in the last 7 days, per resource (sampled: last 100). */
  weeklyNew: {
    users: number;
    events: number;
    memberships: number;
    registrations: number;
    attendance: number;
    certificates: number;
  };
  /** Latest 5 registrations (server returns populated event + student). */
  recentRegistrations: EventRegistration[];
  /** Next upcoming published events (soonest first). */
  upcomingEvents: EventItem[];
}

const total = (r: { meta?: { total: number } }) => r.meta?.total ?? 0;

async function fetchStats(): Promise<DashboardStats> {
  const [
    users,
    roles,
    clubs,
    activeClubs,
    memberships,
    pendingMemberships,
    events,
    pendingEvents,
    registrations,
    pendingRegistrations,
    attendance,
    certificates,
    pendingCertificates,
    perEventStatus,
    perCertificateStatus,
    perRegistrationStatus,
    perMembershipStatus,
    perAttendanceStatus,
    allUsers,
    allEvents,
    allMemberships,
    allAttendance,
    allCertificates,
    recentRegistrations,
    weekRegistrations,
    publishedEvents,
  ] = await Promise.all([
    usersApi.listUsers({ limit: 1 }),
    rolesApi.listRoles({ limit: 1 }),
    clubsApi.listClubs({ limit: 1 }),
    clubsApi.listClubs({ isActive: true, limit: 1 }),
    clubMembershipsApi.listMemberships({ limit: 1 }),
    clubMembershipsApi.listMemberships({ status: "PENDING", limit: 1 }),
    eventsApi.listEvents({ limit: 1 }),
    eventsApi.listEvents({ status: "PENDING", limit: 1 }),
    eventRegistrationsApi.listRegistrations({ limit: 1 }),
    eventRegistrationsApi.listRegistrations({ status: "PENDING", limit: 1 }),
    attendanceApi.listAttendance({ limit: 1 }),
    certificatesApi.listCertificates({ limit: 1 }),
    certificatesApi.listCertificates({ status: "PENDING", limit: 1 }),
    Promise.all(
      EVENT_STATUSES.map((status) => eventsApi.listEvents({ status, limit: 1 }))
    ),
    Promise.all(
      CERTIFICATE_STATUSES.map((status) =>
        certificatesApi.listCertificates({ status, limit: 1 })
      )
    ),
    Promise.all(
      REGISTRATION_STATUSES.map((status) =>
        eventRegistrationsApi.listRegistrations({ status, limit: 1 })
      )
    ),
    Promise.all(
      (["PENDING", "ACTIVE", "INACTIVE"] as MembershipStatus[]).map((status) =>
        clubMembershipsApi.listMemberships({ status, limit: 1 })
      )
    ),
    Promise.all(
      ATTENDANCE_STATUSES.map((status) =>
        attendanceApi.listAttendance({ status, limit: 1 })
      )
    ),
    usersApi.listUsers({ limit: 100 }),
    eventsApi.listEvents({ limit: 100 }),
    clubMembershipsApi.listMemberships({ limit: 100 }),
    attendanceApi.listAttendance({ limit: 100 }),
    certificatesApi.listCertificates({ limit: 100 }),
    eventRegistrationsApi.listRegistrations({ limit: 5 }),
    eventRegistrationsApi.listRegistrations({ limit: 100 }),
    eventsApi.listEvents({ status: "PUBLISHED", limit: 10 }),
  ]);

  const eventsByStatus = Object.fromEntries(
    EVENT_STATUSES.map((s, i) => [s, total(perEventStatus[i])])
  ) as Record<EventStatus, number>;

  const certificatesByStatus = Object.fromEntries(
    CERTIFICATE_STATUSES.map((s, i) => [s, total(perCertificateStatus[i])])
  ) as Record<CertificateStatus, number>;

  const registrationsByStatus = Object.fromEntries(
    REGISTRATION_STATUSES.map((s, i) => [s, total(perRegistrationStatus[i])])
  ) as Record<RegistrationStatus, number>;

  const membershipsByStatus = Object.fromEntries(
    (["PENDING", "ACTIVE", "INACTIVE"] as MembershipStatus[]).map((s, i) => [
      s,
      total(perMembershipStatus[i]),
    ])
  ) as Record<MembershipStatus, number>;

  const attendanceByStatus = Object.fromEntries(
    ATTENDANCE_STATUSES.map((s, i) => [s, total(perAttendanceStatus[i])])
  ) as Record<AttendanceStatus, number>;

  // Users grouped by role name
  const roleCounts = new Map<string, number>();
  for (const u of allUsers.data ?? []) {
    roleCounts.set(u.role, (roleCounts.get(u.role) ?? 0) + 1);
  }
  const usersByRole = [...roleCounts.entries()]
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count);

  // Registrations bucketed per day over the last 7 days
  const days: { date: string; label: string; count: number }[] = [];
  const counts = new Map<string, number>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({
      date: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      count: 0,
    });
    counts.set(key, 0);
  }
  for (const r of weekRegistrations.data ?? []) {
    const key = new Date(r.registeredAt ?? r.createdAt)
      .toISOString()
      .slice(0, 10);
    if (counts.has(key)) counts.set(key, counts.get(key)! + 1);
  }
  const registrationTrend = days.map((d) => ({
    ...d,
    count: counts.get(d.date) ?? 0,
  }));

  // Records created within the last 7 days (sampled over latest 100 each).
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inLastWeek = (list?: { createdAt?: string }[]) =>
    (list ?? []).filter(
      (r) => r.createdAt && new Date(r.createdAt).getTime() >= weekAgo
    ).length;
  const weeklyNew = {
    users: inLastWeek(allUsers.data),
    events: inLastWeek(allEvents.data),
    memberships: inLastWeek(allMemberships.data),
    registrations: inLastWeek(weekRegistrations.data),
    attendance: inLastWeek(allAttendance.data),
    certificates: inLastWeek(allCertificates.data),
  };

  const now = Date.now();
  const upcomingEvents = (publishedEvents.data ?? [])
    .filter((e) => new Date(e.startAt).getTime() >= now)
    .slice(0, 5);

  return {
    totals: {
      users: total(users),
      roles: total(roles),
      clubs: total(clubs),
      activeClubs: total(activeClubs),
      memberships: total(memberships),
      events: total(events),
      registrations: total(registrations),
      attendance: total(attendance),
      certificates: total(certificates),
    },
    pending: {
      events: total(pendingEvents),
      registrations: total(pendingRegistrations),
      memberships: total(pendingMemberships),
      certificates: total(pendingCertificates),
    },
    eventsByStatus,
    certificatesByStatus,
    registrationsByStatus,
    membershipsByStatus,
    attendanceByStatus,
    usersByRole,
    registrationTrend,
    weeklyNew,
    recentRegistrations: recentRegistrations.data ?? [],
    upcomingEvents,
  };
}

export const DASHBOARD_STATS_KEY = ["dashboard", "stats"] as const;

/** Super-admin analytics — requires *:read across all resources. */
export function useDashboardStats(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_STATS_KEY,
    queryFn: fetchStats,
    enabled,
  });
}
