"use client";

import { useParams } from "next/navigation";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useMembership } from "../../_hooks/use-memberships";
import { MembershipForm } from "../../_components/membership-form";

export default function EditMembershipPage() {
  const params = useParams<{ membershipId: string }>();
  const { data, isPending, error, refetch } = useMembership(
    params.membershipId
  );
  const membership = data?.membership;

  if (isPending) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading membership…
      </div>
    );
  }

  if (error || !membership) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error instanceof Error
              ? error.message
              : "Membership not found."}
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
        <h1 className="text-2xl font-bold tracking-tight">Edit membership</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update this member&apos;s club role or status.
        </p>
      </div>
      <div className="max-w-3xl">
        <MembershipForm membership={membership} />
      </div>
    </div>
  );
}
