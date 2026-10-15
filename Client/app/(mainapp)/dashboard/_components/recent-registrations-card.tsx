import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";

import type { EventRegistration } from "@/api/event-registrations.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_STYLES: Record<string, string> = {
  REGISTERED: "bg-muted text-muted-foreground border-border/60",
  PENDING: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-destructive/15 text-destructive border-destructive/30",
  CANCELLED: "bg-muted text-muted-foreground border-border/60 line-through opacity-75",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RecentRegistrationsCard({
  registrations,
}: {
  registrations: EventRegistration[];
}) {
  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold">
          Recent registrations
        </CardTitle>
        <Button asChild size="sm" variant="ghost" className="h-8 text-xs">
          <Link href="/event-registration">
            View all
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {registrations.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No registrations yet.
          </p>
        ) : (
          <div className="divide-y divide-border/40">
            {registrations.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.student?.name ?? `Student …${r.studentId.slice(-6)}`}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.event?.title ?? `Event …${r.eventId.slice(-6)}`} ·{" "}
                      {timeAgo(r.registeredAt ?? r.createdAt)}
                    </p>
                  </div>
                </div>
                <Badge
                  className={`${STATUS_STYLES[r.status] ?? ""} hidden shrink-0 text-xs sm:inline-flex`}
                >
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
