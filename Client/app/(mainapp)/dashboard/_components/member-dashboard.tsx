import { GraduationCap } from "lucide-react";

import type { AuthUser } from "@/api/auth.api";
import { getRoleLabel } from "@/api/auth.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function MemberDashboard({ user }: { user: AuthUser | null }) {
  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
      <CardHeader className="flex-row items-center gap-3.5 space-y-0 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <CardTitle className="text-base font-semibold">Signed in</CardTitle>
          <CardDescription className="text-xs">{user?.email}</CardDescription>
        </div>
        {user && (
          <Badge variant="secondary" className="ml-auto">
            {getRoleLabel(user.role)}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <p className="text-sm text-muted-foreground">
          Use the sidebar to manage resources.
        </p>
      </CardContent>
    </Card>
  );
}
