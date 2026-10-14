import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ForbiddenState({ message }: { message?: string }) {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col items-center justify-center gap-8 p-6 text-center">
      {/* Icon */}
      <div className="relative">
        <div className="absolute -inset-6 rounded-full bg-destructive/10 blur-2xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-destructive/20 bg-destructive/10 shadow-lg shadow-destructive/10">
          <ShieldAlert className="h-12 w-12 text-destructive" />
        </div>
      </div>

      {/* Text */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive">
          403 &middot; Forbidden
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Access denied
        </h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {message ??
            "You don't have permission to view this page. Contact an administrator if you think this is a mistake."}
        </p>
      </div>

      {/* Action */}
      <Button asChild className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Link>
      </Button>
    </div>
  );
}
