"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Mail,
  ShieldCheck,
  BookOpen,
  KeyRound,
} from "lucide-react";

import { authService, AUTH_ME_KEY, getRoleLabel } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogoutButton } from "@/components/ui/logout-button";
import { ChangePasswordDialog } from "./_components/change-password-dialog";
import { ConsoleShell } from "./console-shell";

export default function DashboardPage() {
  const router = useRouter();
  const [changingPassword, setChangingPassword] = useState(false);

  const { data, error, isPending, refetch } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authService.me,
    retry: false,
  });

  useEffect(() => {
    if (error instanceof ApiRequestError && error.status === 401) {
      router.replace("/login");
    }
  }, [error, router]);

  if (error) {
    if (!(error instanceof ApiRequestError && error.status === 401)) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-ambient-mesh p-6">
          <Card className="w-full max-w-md text-center border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle>Can&apos;t reach the server</CardTitle>
              <CardDescription>
                {error instanceof Error ? error.message : "Something went wrong."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
              <Button variant="ghost" onClick={() => router.replace("/login")}>
                Back to login
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  if (isPending || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ambient-mesh p-6" />
    );
  }

  const { user } = data;

  // Users with a student profile (studentId) see the student portal.
  // Everyone else (SUPER_ADMIN + any custom admin-type role) sees the sidebar shell.
  if (!user.studentId) {
    return <ConsoleShell user={user} />;
  }

  return (
    <div className="min-h-screen bg-ambient-mesh">
      <header className="border-b border-border/60 bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">CampusLMS</span>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-accent text-accent-foreground border-border/80">
              <BookOpen className="h-3.5 w-3.5" />
              {getRoleLabel(user.role)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangingPassword(true)}
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
            <LogoutButton showIcon className="w-auto" variant="outline" size="sm" />
          </div>
        </div>
      </header>

      <ChangePasswordDialog
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
      />

      <main className="flex min-h-[calc(100vh-8rem)] flex-1 flex-col gap-4 p-4 md:gap-8 md:px-5 md:py-2">
        <section className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome back, {user.name.split(" ")[0]}. Here&apos;s your student portal overview.
            </p>
          </div>
        </section>

        <section className="w-full">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Signed-in Student Account
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Your session is active for 24 hours.
                </CardDescription>
              </div>
              <span className="rounded-lg border border-border/60 bg-muted p-2 text-muted-foreground">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-4">
                <div>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
