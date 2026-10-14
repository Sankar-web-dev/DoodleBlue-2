"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { authService, AUTH_ME_KEY } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ConsoleShell } from "./console-shell";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

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

  return <ConsoleShell user={data.user}>{children}</ConsoleShell>;
}
