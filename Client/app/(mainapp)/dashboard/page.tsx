"use client";

import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";

import { authService, AUTH_ME_KEY, getRoleLabel } from "@/api/auth.api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const { data } = useQuery({ queryKey: AUTH_ME_KEY, queryFn: authService.me });
  const user = data?.user;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user ? `Welcome back, ${user.name.split(" ")[0]}.` : "Welcome back."}
        </p>
      </div>

      <Card className="border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="rounded-lg bg-primary/10 p-2 text-primary">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <CardTitle className="text-base">Signed in</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
          {user && (
            <Badge className="ml-auto bg-secondary text-secondary-foreground">
              {getRoleLabel(user.role)}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Use the sidebar to manage resources.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
