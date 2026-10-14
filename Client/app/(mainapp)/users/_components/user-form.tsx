"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ShieldCheck, KeyRound, RefreshCw, Eye, EyeOff } from "lucide-react";

import { USERS_LIST_KEY, type User } from "@/api/users.api";
import { useRoles } from "../../roles/_hooks/use-roles";
import { createUserAction, updateUserAction } from "../_actions/users.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RESOURCE_LABELS,
  ACTION_LABELS,
  type Resource,
  type Action,
} from "@/lib/permissions";

interface UserFormProps {
  user?: User;
}

export function UserForm({ user }: UserFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!user;

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const roles = rolesData?.data ?? [];
  // For selecting a new role, only active roles are shown.
  // But if the edited user already has an assigned role (even if inactive/legacy),
  // include it so that it displays in the selector.
  const activeRoles = roles.filter(
    (r) => r.isActive || (user && (r.id === user.roleId || r.name.toLowerCase() === user.role.toLowerCase()))
  );

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState(user?.roleId ?? "");
  const [image, setImage] = useState(user?.image ?? "");
  const [isActive, setIsActive] = useState(user?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  // Sync state if user prop changes or loads asynchronously
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setImage(user.image ?? "");
      setIsActive(user.isActive ?? true);
      if (user.roleId) {
        setRoleId(user.roleId);
      }
    }
  }, [user]);

  // When roles load, if user has roleId or role name, ensure roleId is matched accurately
  useEffect(() => {
    if (roles.length > 0 && user) {
      if (user.roleId && roles.some((r) => r.id === user.roleId)) {
        setRoleId(user.roleId);
      } else if (user.role) {
        const matched = roles.find(
          (r) => r.name.toLowerCase() === user.role.toLowerCase()
        );
        if (matched) {
          setRoleId(matched.id);
        }
      }
    }
  }, [roles, user]);

  function generatePassword() {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*";
    let gen = "";
    for (let i = 0; i < 14; i++) {
      gen += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(gen);
    setShowPassword(true);
  }

  const selectedRole = roles.find((r) => r.id === roleId);
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const createMutation = useMutation({
    mutationFn: () =>
      createUserAction({
        name,
        email,
        password,
        roleId,
        image: image || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      router.push("/users");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateUserAction(user!.id, {
        name,
        email,
        ...(password ? { password } : {}),
        roleId: isSuperAdmin ? undefined : roleId,
        image,
        isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ["users", "detail", user!.id] });
      router.push("/users");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!isEdit) {
      if (!password) {
        setError("Password is required.");
        return;
      }
      if (password.length < 10) {
        setError("Password must be at least 10 characters.");
        return;
      }
      if (!roleId) {
        setError("Please select a role.");
        return;
      }
    } else {
      if (password && password.length < 10) {
        setError("New password must be at least 10 characters.");
        return;
      }
      if (!isSuperAdmin && !roleId) {
        setError("Please select a role.");
        return;
      }
    }

    if (isEdit) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="user-name">Full name</Label>
        <Input
          id="user-name"
          placeholder="e.g. Jane Doe"
          className="h-11 rounded-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <Label htmlFor="user-email">Email address</Label>
        <Input
          id="user-email"
          type="email"
          placeholder="e.g. user@campus.edu"
          className="h-11 rounded-xl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="user-password">
            {isEdit ? "New password (leave blank to keep current)" : "Temporary password"}{" "}
            <span className="text-xs text-muted-foreground">(min 10 chars)</span>
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={generatePassword}
            className="h-7 px-2 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
            disabled={isPending}
          >
            <KeyRound className="h-3 w-3" />
            Auto-generate
          </Button>
        </div>
        <div className="relative">
          <Input
            id="user-password"
            type={showPassword ? "text" : "password"}
            placeholder={isEdit ? "Leave blank to keep unchanged" : "••••••••••"}
            className="h-11 rounded-xl pr-10 font-mono text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEdit
            ? "Setting a new password will prompt the user to change it on their next login."
            : "The user will be required to change this password on their first login."}
        </p>
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role-select">Assigned Role</Label>
        {isSuperAdmin ? (
          <div className="flex h-11 items-center rounded-xl border border-border/70 bg-muted/30 px-3.5 text-sm">
            <span className="font-medium text-foreground">SUPER_ADMIN</span>
            <Badge variant="secondary" className="ml-2 text-[10px]">
              System (Locked)
            </Badge>
          </div>
        ) : (
          <Select
            value={roleId}
            onValueChange={(val) => {
              setRoleId(val);
              setError(null);
            }}
            disabled={rolesLoading || isPending}
          >
            <SelectTrigger id="role-select" className="h-11 rounded-xl w-full">
              <SelectValue placeholder={rolesLoading ? "Loading roles..." : "Choose a role"}>
                {selectedRole ? (
                  <span className="flex items-center gap-2">
                    <span>{selectedRole.name}</span>
                    {selectedRole.isSystem && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        System
                      </Badge>
                    )}
                  </span>
                ) : user?.role ? (
                  <span>{user.role}</span>
                ) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {activeRoles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <div className="flex items-center gap-2">
                    <span>{r.name}</span>
                    {r.isSystem && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        System
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Role preview: shows permissions granted by selected roleId */}
      {selectedRole && (
        <div className="rounded-xl border border-border/70 bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Role permissions preview ({selectedRole.name})
              </span>
            </div>
            <span className="text-[11px] font-mono text-muted-foreground">
              ID: {selectedRole.id}
            </span>
          </div>

          {selectedRole.permissions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No explicit permissions configured for this role.
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border/50 divide-y divide-border/40">
              {selectedRole.permissions.map((perm) => (
                <div
                  key={perm.resource}
                  className="flex items-center justify-between px-3 py-2 text-xs bg-background/50"
                >
                  <span className="font-medium">
                    {RESOURCE_LABELS[perm.resource as Resource] ?? perm.resource}
                  </span>
                  <div className="flex gap-1">
                    {(["create", "read", "update", "delete"] as Action[]).map(
                      (action) => (
                        <span
                          key={action}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                            perm.actions.includes(action)
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/50 text-muted-foreground/30"
                          }`}
                        >
                          {ACTION_LABELS[action]}
                        </span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Active Status in Edit mode */}
      {isEdit && (
        <div className="space-y-2">
          <Label htmlFor="status-select">Account Status</Label>
          <Select
            value={isActive ? "active" : "inactive"}
            onValueChange={(val) => setIsActive(val === "active")}
            disabled={isPending || isSuperAdmin}
          >
            <SelectTrigger id="status-select" className="h-11 rounded-xl w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Profile Image */}
      <div className="space-y-2">
        <Label htmlFor="user-image">
          Avatar Image URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="user-image"
          placeholder="https://example.com/avatar.jpg"
          className="h-11 rounded-xl"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Error display */}
      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/users")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          disabled={isPending}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save changes" : "Provision user"}
        </Button>
      </div>
    </form>
  );
}

export default UserForm;