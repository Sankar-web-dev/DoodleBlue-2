"use client";

import { Building2, CheckCircle2, XCircle } from "lucide-react";

import type { Club } from "@/api/clubs.api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface ClubDetailsSheetProps {
  club: Club | null;
  onClose: () => void;
}

export function ClubDetailsSheet({ club, onClose }: ClubDetailsSheetProps) {
  return (
    <Sheet open={!!club} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        {club && (
          <>
            <SheetHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <SheetTitle>{club.name}</SheetTitle>
                  <SheetDescription>
                    {club.description || "No description"}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="mt-4 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {club.department}
              </Badge>
              <Badge
                className={
                  club.isActive
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs"
                    : "bg-muted text-muted-foreground border-border/40 text-xs"
                }
              >
                {club.isActive ? (
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                ) : (
                  <XCircle className="h-3 w-3 mr-1" />
                )}
                {club.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <Separator className="my-5" />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Faculty coordinator</dt>
                <dd className="font-mono text-xs">{club.facultyCoordinatorId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Logo</dt>
                <dd className="truncate max-w-[200px]">
                  {club.logoUrl ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd>{new Date(club.createdAt).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Updated</dt>
                <dd>{new Date(club.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
