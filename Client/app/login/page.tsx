"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Image as ImageIcon,
} from "lucide-react";

import { authService, AUTH_ME_KEY, getRoleLabel } from "@/api/auth.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: () => authService.signIn(email.trim(), password),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_ME_KEY, { user });
      setFormError(null);

      toast.success(`Welcome back, ${user.name.split(" ")[0]}`, {
        description: `Signed in as ${getRoleLabel(user.role)}`,
      });
      router.replace("/dashboard");
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        if (error.code === "INVALID_CREDENTIALS") {
          setFormError("Invalid email or password.");
        } else if (error.code === "LOGIN_RATE_LIMITED") {
          setFormError("Too many attempts. Please try again later.");
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }
    setFormError(null);
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-[#FFFFF1]">
      {/* Left panel: Empty UI placeholder for future logo */}
      <div className="relative hidden items-center justify-center border-r border-border/60 bg-muted/20 lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, var(--primary) / 0.12 0, transparent 70%)",
          }}
        />
        <img src="./login.png" alt="Login Image" className="w-full h-full" />
      </div>

      {/* Right form panel */}
      <div className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card/95 p-8 shadow-md backdrop-blur sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/10">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              <span className="gradient-text">Welcome back</span>
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your LMS account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl pl-10 border-border/70 focus-visible:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loginMutation.isPending}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 rounded-xl pl-10 pr-11 border-border/70 focus-visible:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loginMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {formError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {formError}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are provisioned by your administrator.
          </p>
        </div>
      </div>
    </div>
  );
}
