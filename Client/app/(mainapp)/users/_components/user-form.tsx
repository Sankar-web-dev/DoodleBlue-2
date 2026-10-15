"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ShieldCheck, KeyRound, Eye, EyeOff, Mail, Upload,X } from "lucide-react";

import { USERS_LIST_KEY, usersApi, type User } from "@/api/users.api";
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [isUploadingImage, setIsUploadingImage] = useState(false);
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
        // No password — the server generates one and emails it to the user.
        roleId,
        image: image || undefined,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      if (data.emailSent) {
        toast.success("User created", {
          description: "Login credentials were emailed to them.",
        });
      } else {
        toast.warning("User created — email not sent", {
          description:
            "Email isn't configured on the server; share credentials manually.",
        });
      }
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

  const isPending = createMutation.isPending || updateMutation.isPending || isUploadingImage;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPEG, PNG, WEBP, GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }

    try {
      setIsUploadingImage(true);
      setError(null);
      const res = await usersApi.uploadAvatar(file);
      setImage(res.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setError(msg);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

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

      {/* Password — create emails generated credentials; edit = manual reset */}
      {isEdit ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="user-password">
              New password (leave blank to keep current){" "}
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
              placeholder="Leave blank to keep unchanged"
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
            Setting a new password will prompt the user to change it on their next login.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            Login credentials are generated automatically and emailed to the
            user — they&apos;ll be required to set a new password on first
            sign-in.
          </p>
        </div>
      )}

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

      {/* Profile Image with Multer Upload */}
      <div className="space-y-3">
        <Label>Profile Avatar <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>

        <div className="flex items-center gap-4">
          {/* Avatar Preview */}
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-border/80 bg-muted flex items-center justify-center shadow-sm">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt="Avatar preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-semibold text-muted-foreground">
                {name ? name.charAt(0).toUpperCase() : "?"}
              </span>
            )}
            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                disabled={isPending}
                className="absolute top-0 right-0 bg-background/90 text-foreground rounded-full p-0.5 shadow hover:bg-destructive hover:text-destructive-foreground transition-colors"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isPending}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 text-xs h-9"
                onClick={() => fileInputRef.current?.click()}
                disabled={isPending}
              >
                {isUploadingImage ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
                {isUploadingImage ? "Uploading..." : "Upload photo"}
              </Button>
              <span className="text-xs text-muted-foreground">
                JPEG, PNG, WEBP or GIF (Max 5MB)
              </span>
            </div>

            <Input
              id="user-image"
              placeholder="Or paste image URL (e.g. /uploads/profiles/... or https://...)"
              className="h-9 rounded-xl text-xs"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
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