"use client";

import { UserCheck, ShieldCheck, Mail, Calendar, KeyRound, CheckCircle2, XCircle } from "lucide-react";

import type { User } from "@/api/users.api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface UserDetailsSheetProps {
  user: User | null;
  onClose: () => void;
}

export function UserDetailsSheet({ user, onClose }: UserDetailsSheetProps) {
  return (
    <Sheet open={!!user} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {user && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                {user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name}
                    className="h-10 w-10 shrink-0 rounded-full border border-primary/20 object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserCheck className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <SheetTitle>{user.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <ShieldCheck className="h-3 w-3" />
                {user.role}
              </Badge>
              <Badge
                className={
                  user.isActive
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                    : "bg-muted text-muted-foreground border-border/40 text-xs"
                }
              >
                {user.isActive ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
              {user.mustChangePassword && (
                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/10 text-xs">
                  <KeyRound className="h-3 w-3 mr-1" />
                  Must reset password
                </Badge>
              )}
            </div>

            <Separator className="my-5" />

            <div className="space-y-4">
              <h4 className="text-sm font-semibold">User Details</h4>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">User ID</dt>
                  <dd className="font-mono text-xs">{user.id}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Role ID</dt>
                  <dd className="font-mono text-xs">{user.roleId ?? "System (None)"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {new Date(user.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
