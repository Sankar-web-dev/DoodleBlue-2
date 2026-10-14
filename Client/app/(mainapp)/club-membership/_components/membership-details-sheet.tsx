"use client";

import { UserCheck, Building2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import type { MembershipRow } from "../_hooks/use-memberships";
import { MembershipStatusBadge } from "./membership-status-badge";

interface MembershipDetailsSheetProps {
  membership: MembershipRow | null;
  onClose: () => void;
}

export function MembershipDetailsSheet({
  membership,
  onClose,
}: MembershipDetailsSheetProps) {
  return (
    <Sheet open={!!membership} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {membership && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle>{membership.studentName}</SheetTitle>
                  <SheetDescription>
                    {membership.studentEmail || "No email"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <Badge
                variant={
                  membership.membershipRole === "COORDINATOR"
                    ? "default"
                    : "outline"
                }
                className="text-xs"
              >
                {membership.membershipRole === "COORDINATOR"
                  ? "Coordinator"
                  : "Member"}
              </Badge>
              <MembershipStatusBadge status={membership.status} />
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Club</h4>
              <div className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {membership.clubName}
                  </p>
                  {membership.clubDepartment && (
                    <p className="truncate text-xs text-muted-foreground">
                      {membership.clubDepartment}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Assigned by</dt>
                <dd>{membership.assignedByName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Assigned at</dt>
                <dd>{new Date(membership.assignedAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(membership.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(membership.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
