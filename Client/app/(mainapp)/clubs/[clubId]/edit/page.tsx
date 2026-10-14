"use client";

import { useParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { useAuthUser } from "@/lib/use-auth-user";
import { usePermissions } from "@/lib/permissions";
import { ForbiddenState } from "../../../_components/forbidden-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useClub } from "../../_hooks/use-clubs";
import { ClubForm } from "../../_components/club-form";

export default function EditClubPage() {
  const params = useParams<{ clubId: string }>();
  const { data, isPending, error, refetch } = useClub(params.clubId);
  const club = data?.club;

  const { user, isPending: authPending } = useAuthUser();
  const { can } = usePermissions(user);

  if (!authPending && !can("clubs", "update")) {
    return (
      <ForbiddenState message="You don't have permission to edit clubs." />
    );
  }

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading club…
      </div>
    );
  }

  if (error || !club) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error ? error.message : "Club not found."}
          </div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit club</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update the details for &ldquo;{club.name}&rdquo;.
        </p>
      </div>
      <div className="max-w-3xl">
        <ClubForm club={club} />
      </div>
    </div>
  );
}
