"use client";

import { ShieldCheck, Lock, CheckCircle2, XCircle } from "lucide-react";

import type { Role } from "@/api/roles.api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { RESOURCE_LABELS, ACTION_LABELS, type Resource, type Action } from "@/lib/permissions";

interface RoleDetailsSheetProps {
  role: Role | null;
  onClose: () => void;
}

export function RoleDetailsSheet({ role, onClose }: RoleDetailsSheetProps) {
  return (
    <Sheet open={!!role} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {role && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {role.isSystem ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <ShieldCheck className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <SheetTitle>{role.name}</SheetTitle>
                  <SheetDescription>
                    {role.description || "No description"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              {role.isSystem && (
                <Badge variant="secondary" className="text-xs">System</Badge>
              )}
              <Badge
                className={
                  role.isActive
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                    : "bg-muted text-muted-foreground border-border/40 text-xs"
                }
              >
                {role.isActive ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {role.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator className="my-5" />

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Permissions</h4>
              {role.permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No permissions assigned.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  {role.permissions.map((perm, i) => (
                    <div
                      key={perm.resource}
                      className={`flex items-center justify-between gap-2 px-4 py-2.5 ${
                        i !== role.permissions.length - 1
                          ? "border-b border-border/40"
                          : ""
                      } ${i % 2 === 0 ? "bg-background/40" : "bg-muted/20"}`}
                    >
                      <span className="text-sm font-medium text-foreground/80">
                        {RESOURCE_LABELS[perm.resource as Resource] ?? perm.resource}
                      </span>
                      <div className="flex gap-1">
                        {(["create", "read", "update", "delete"] as Action[]).map(
                          (action) => (
                            <span
                              key={action}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                                perm.actions.includes(action)
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted/50 text-muted-foreground/40"
                              }`}
                            >
                              {ACTION_LABELS[action]}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(role.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(role.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
