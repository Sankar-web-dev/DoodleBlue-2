"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  UserPlus,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Mail,
  Sparkles,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

import { usersService, USERS_LIST_KEY } from "@/api/users.api";
import { rolesApi, ROLES_LIST_KEY } from "@/api/roles.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generatePassword } from "./console-utils";

export function CreateAdminDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [formError, setFormError]     = useState<string | null>(null);
  const [created, setCreated]         = useState<{ email: string; password: string } | null>(null);

  // Fetch available roles for the dropdown
  const { data: rolesData } = useQuery({
    queryKey: ROLES_LIST_KEY,
    queryFn: () => rolesApi.listRoles({ isActive: true, limit: 100 }),
    enabled: open,
  });

  const roles = (rolesData?.data ?? []).filter((r) => r.name !== "STUDENT");
  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // Auto-select the ADMIN role when roles load
  useEffect(() => {
    if (roles.length > 0 && !selectedRoleId) {
      const adminRole = roles.find((r) => r.name === "ADMIN");
      setSelectedRoleId(adminRole?.id ?? roles[0].id);
    }
  }, [roles, selectedRoleId]);

  const createMutation = useMutation({
    mutationFn: () =>
      usersService.createAdmin({
        name: name.trim(),
        email: email.trim(),
        temporaryPassword: password,
        roleId: selectedRoleId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      setCreated({ email: email.trim(), password });
      setName("");
      setEmail("");
      setPassword(generatePassword());
      setSelectedRoleId("");
      setFormError(null);
      toast.success("Admin account created", {
        description: "Share the credentials with them.",
      });
    },
    onError: (error) => {
      setCreated(null);
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "EMAIL_IN_USE"
            ? "That email is already registered."
            : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter the admin's full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }
    if (password.length < 10) {
      setFormError("Temporary password must be at least 10 characters.");
      return;
    }
    setFormError(null);
    setCreated(null);
    createMutation.mutate();
  };

  const copyCredentials = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(
      `Email: ${created.email}\nTemporary password: ${created.password}`
    );
    toast.success("Credentials copied");
  };

  const closeAndReset = () => {
    onClose();
    setName("");
    setEmail("");
    setPassword("");
    setShowPassword(false);
    setSelectedRoleId("");
    setFormError(null);
    setCreated(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create admin
          </DialogTitle>
          <DialogDescription>
            Assign a role to define exactly what this user can access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="admin-name">Full name</Label>
            <Input
              id="admin-name"
              placeholder="e.g. Priya Sharma"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={createMutation.isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@school.com"
                className="h-11 rounded-xl pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          {/* Role selector */}
          <div className="space-y-2">
            <Label>Role</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="h-11 w-full justify-between rounded-xl font-normal"
                  disabled={createMutation.isPending || roles.length === 0}
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                    {selectedRole ? selectedRole.name : "Select a role…"}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full min-w-[340px]">
                {roles.map((role) => (
                  <DropdownMenuItem
                    key={role.id}
                    onSelect={() => setSelectedRoleId(role.id)}
                    className="flex flex-col items-start gap-0.5 py-2.5"
                  >
                    <span className="font-medium">{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {selectedRole && (
              <p className="text-xs text-muted-foreground">
                {selectedRole.permissions.length} resource
                {selectedRole.permissions.length !== 1 ? "s" : ""} with access
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="admin-password">Temporary password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Generate a password"
                className="h-11 rounded-xl pl-10 pr-20 font-mono text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={createMutation.isPending}
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPassword(generatePassword())}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Generate password"
                  title="Generate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
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
            <p className="text-xs text-muted-foreground">
              Minimum 10 characters · shown only once
            </p>
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <Button
            type="submit"
            className="h-11 w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create admin account
              </>
            )}
          </Button>
        </form>

        {created && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Account ready — share these credentials
            </p>
            <div className="space-y-1 font-mono text-xs text-foreground/80">
              <p>Email: {created.email}</p>
              <p>Password: {created.password}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
              onClick={copyCredentials}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy credentials
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
