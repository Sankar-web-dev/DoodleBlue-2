"use client";

import { useState } from "react";
import {
  Bell,
  BellRing,
  BookOpen,
  GraduationCap,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  type ActivityNotification,
  type NotificationKind,
  useNotifications,
} from "../_hooks/use-notifications";

// ─── Icon & colour map per kind ───────────────────────────────────────────────

const KIND_META: Record<
  NotificationKind,
  {
    icon: React.ElementType;
    iconCls: string;
    badgeVariant: "success" | "secondary" | "warning" | "destructive";
    badgeLabel: string;
  }
> = {
  enrollment_created: {
    icon: BookOpen,
    iconCls: "text-emerald-500",
    badgeVariant: "success",
    badgeLabel: "Enrolled",
  },
  enrollment_completed: {
    icon: ShieldCheck,
    iconCls: "text-blue-500",
    badgeVariant: "secondary",
    badgeLabel: "Completed",
  },
  enrollment_withdrawn: {
    icon: UserMinus,
    iconCls: "text-amber-500",
    badgeVariant: "warning",
    badgeLabel: "Withdrawn",
  },
  student_created: {
    icon: GraduationCap,
    iconCls: "text-primary",
    badgeVariant: "secondary",
    badgeLabel: "Student",
  },
  student_inactive: {
    icon: UserMinus,
    iconCls: "text-destructive",
    badgeVariant: "destructive",
    badgeLabel: "Inactive",
  },
  admin_created: {
    icon: UserPlus,
    iconCls: "text-violet-500",
    badgeVariant: "secondary",
    badgeLabel: "Admin",
  },
};

// ─── Relative-time helper ─────────────────────────────────────────────────────

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ─── Single notification item ─────────────────────────────────────────────────

function NotificationItem({ item }: { item: ActivityNotification }) {
  const meta = KIND_META[item.kind];
  const Icon = meta.icon;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/50 bg-background/60 px-4 py-3 transition-colors hover:bg-muted/40">
      {/* Icon bubble */}
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted/50">
        <Icon className={`h-4 w-4 ${meta.iconCls}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold leading-snug">{item.title}</p>
          <Badge variant={meta.badgeVariant} className="text-[10px] px-1.5 py-0">
            {meta.badgeLabel}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
          {item.description}
        </p>
        <p className="mt-1 text-[11px] font-medium text-muted-foreground/70">
          {relativeTime(item.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Main sheet component ─────────────────────────────────────────────────────

export function NotificationSheet() {
  const [open, setOpen] = useState(false);
  const { notifications, isPending, isError, refetch } = useNotifications();

  const unreadCount = Math.min(notifications.length, 99);
  const hasUnread = unreadCount > 0;

  return (
    <>
      {/* ── Trigger button ── */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 shrink-0"
        aria-label="Open notifications"
        onClick={() => setOpen(true)}
        id="notification-bell-btn"
      >
        {hasUnread ? (
          <BellRing className="h-5 w-5 text-primary" />
        ) : (
          <Bell className="h-5 w-5" />
        )}
        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* ── Sheet ── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-[420px]"
        >
          {/* Header */}
          <SheetHeader className="border-b border-border/60 px-5 py-4">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <BellRing className="h-4 w-4 text-primary" />
                  Activity Feed
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-xs">
                  Recent actions by students &amp; admins
                </SheetDescription>
              </div>
              <div className="flex items-center gap-1" />
            </div>

            {/* Count pill */}
            {!isPending && (
              <p className="mt-2 text-xs text-muted-foreground">
                {notifications.length === 0
                  ? "No activity yet"
                  : `${notifications.length} activit${notifications.length === 1 ? "y" : "ies"} found`}
              </p>
            )}
          </SheetHeader>

          {/* ── Body ── */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {isPending ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl border border-border/40 px-4 py-3">
                    <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-8 text-center">
                <p className="text-sm font-medium text-destructive">
                  Could not load activity
                </p>
                <p className="text-xs text-muted-foreground">
                  Check your connection and try again.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Retry
                </Button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-4 py-12 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Actions by admins and students will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => (
                  <NotificationItem key={n.id} item={n} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isPending && notifications.length > 0 && (
            <div className="border-t border-border/60 px-5 py-3">
              <p className="text-center text-[11px] text-muted-foreground">
                Showing the latest {notifications.length} activities · Auto-refreshes every 60s
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
