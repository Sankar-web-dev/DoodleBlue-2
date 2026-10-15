"use client";

import Link from "next/link";
import {
  Users,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
  Award,
  UserCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventStatusBadge } from "@/app/(mainapp)/events/_components/event-status-badge";

import type { DashboardStats } from "../_hooks/use-dashboard-stats";
import { StatCard } from "./stat-card";
import { StatusBreakdownCard } from "./status-breakdown-card";
import { AttendanceRateCard } from "./attendance-rate-card";
import { RegistrationsTrendCard } from "./registrations-trend-card";
import { PipelineCard } from "./pipeline-card";
import { UsersByRoleCard } from "./users-by-role-card";
import { RecentRegistrationsCard } from "./recent-registrations-card";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted-foreground/40",
  PENDING: "bg-amber-500",
  APPROVED: "bg-sky-500",
  REJECTED: "bg-destructive",
  PUBLISHED: "bg-emerald-500",
  CANCELLED: "bg-muted-foreground/30",
  ISSUED: "bg-emerald-500",
  REGISTERED: "bg-sky-500",
  ACTIVE: "bg-emerald-500",
  INACTIVE: "bg-muted-foreground/40",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PUBLISHED: "Published",
  CANCELLED: "Cancelled",
  ISSUED: "Issued",
  REGISTERED: "Registered",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

interface AdminDashboardProps {
  stats: DashboardStats;
  error: unknown;
  onRetry: () => void;
}

export function AdminDashboard({
  stats,
  error,
  onRetry,
}: AdminDashboardProps) {
  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "Failed to load dashboard stats."}
          </div>
          <Button size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const {
    totals,
    pending,
    eventsByStatus,
    certificatesByStatus,
    registrationsByStatus,
    membershipsByStatus,
    attendanceByStatus,
    usersByRole,
    registrationTrend,
    weeklyNew,
    recentRegistrations,
    upcomingEvents,
  } = stats;

  const pendingTotal =
    pending.events +
    pending.registrations +
    pending.memberships +
    pending.certificates;

  return (
    <div className="flex flex-col gap-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Total Users"
          value={totals.users}
          icon={Users}
          href="/users"
          delta={weeklyNew.users}
        />
        <StatCard
          label="Total Events"
          value={totals.events}
          icon={CalendarDays}
          href="/events"
          delta={weeklyNew.events}
          accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <StatCard
          label="Registrations"
          value={totals.registrations}
          icon={ClipboardList}
          href="/event-registration"
          delta={weeklyNew.registrations}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Attendance Records"
          value={totals.attendance}
          icon={ClipboardCheck}
          href="/attendances"
          delta={weeklyNew.attendance}
          accent="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />
        <StatCard
          label="Memberships"
          value={totals.memberships}
          icon={UserCheck}
          href="/club-membership"
          delta={weeklyNew.memberships}
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Certificates"
          value={totals.certificates}
          icon={Award}
          href="/certificates"
          delta={weeklyNew.certificates}
          accent="bg-rose-500/10 text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Needs your attention — hidden when nothing is pending */}
      {pendingTotal > 0 && (
      <Card className="border-destructive/25 bg-destructive/5 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
            <AlertCircle className="h-4 w-4" />
            Needs Your Attention
          </CardTitle>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            {pendingTotal} pending
          </span>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Events to review", count: pending.events, href: "/events", icon: CalendarDays },
              { label: "Registrations to review", count: pending.registrations, href: "/event-registration", icon: ClipboardList },
              { label: "Memberships to approve", count: pending.memberships, href: "/club-membership", icon: UserCheck },
              { label: "Certificates to approve", count: pending.certificates, href: "/certificates", icon: Award },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/80 px-4 py-3 transition-colors hover:border-destructive/40 hover:bg-card"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      item.count > 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground/60"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-lg font-bold leading-none tabular-nums">
                      {item.count}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.label}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Analytics row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <AttendanceRateCard
          present={attendanceByStatus.PRESENT ?? 0}
          absent={attendanceByStatus.ABSENT ?? 0}
        />
        <RegistrationsTrendCard trend={registrationTrend} />
        <PipelineCard
          title="Participation funnel"
          stages={[
            {
              label: "Approved registrations",
              value: registrationsByStatus.APPROVED ?? 0,
              color: "bg-sky-500",
            },
            {
              label: "Marked present",
              value: attendanceByStatus.PRESENT ?? 0,
              color: "bg-violet-500",
            },
            {
              label: "Certificates issued",
              value: certificatesByStatus.ISSUED ?? 0,
              color: "bg-emerald-500",
            },
          ]}
        />
      </div>

      {/* Status breakdowns — 4 across on desktop */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatusBreakdownCard
          title="Events by status"
          slices={Object.entries(eventsByStatus).map(([status, value]) => ({
            label: STATUS_LABELS[status] ?? status,
            value,
            color: STATUS_COLORS[status] ?? "bg-muted-foreground/40",
          }))}
        />
        <StatusBreakdownCard
          title="Registrations by status"
          slices={Object.entries(registrationsByStatus).map(
            ([status, value]) => ({
              label: STATUS_LABELS[status] ?? status,
              value,
              color: STATUS_COLORS[status] ?? "bg-muted-foreground/40",
            })
          )}
        />
        <StatusBreakdownCard
          title="Certificates by status"
          slices={Object.entries(certificatesByStatus).map(
            ([status, value]) => ({
              label: STATUS_LABELS[status] ?? status,
              value,
              color: STATUS_COLORS[status] ?? "bg-muted-foreground/40",
            })
          )}
        />
        <StatusBreakdownCard
          title="Memberships by status"
          slices={Object.entries(membershipsByStatus).map(
            ([status, value]) => ({
              label: STATUS_LABELS[status] ?? status,
              value,
              color: STATUS_COLORS[status] ?? "bg-muted-foreground/40",
            })
          )}
        />
      </div>

      {/* Bottom row — roles donut | recent | upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        <UsersByRoleCard usersByRole={usersByRole} />
        <RecentRegistrationsCard registrations={recentRegistrations} />
        <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold">
              Upcoming events
            </CardTitle>
            <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
              <Link href="/events">
                View all
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No upcoming published events.
              </p>
            ) : (
              <div className="divide-y divide-border/40">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event.id}
                    href="/events"
                    className="flex items-center justify-between gap-4 py-3 transition-colors first:pt-0 last:pb-0 hover:bg-accent/30 -mx-2 rounded-lg px-2"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {event.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {event.venue} ·{" "}
                          {new Date(event.startAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                    </div>
                    <span className="hidden shrink-0 sm:block">
                      <EventStatusBadge status={event.status} />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
