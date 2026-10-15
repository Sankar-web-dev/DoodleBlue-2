"use client";

import { useState } from "react";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Crown,
  UserCog,
  Loader2,
} from "lucide-react";
import { useProfile } from "../_hooks/use-profile";
import { getRoleLabel } from "@/api/auth.api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { initials } from "../../_components/console-utils";
import { ProfilePasswordForm } from "./profile-password-form";

export function ProfileView() {
  const { user, isLoading } = useProfile();
  const [imgFailed, setImgFailed] = useState(false);

  if (isLoading && !user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No active user session found.
      </div>
    );
  }

  const isSuper = user.role === "SUPER_ADMIN";
  const RoleIcon = isSuper ? Crown : UserCog;
  const imageUrl = user.image && !imgFailed ? user.image : null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">
          View your account information and manage your credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview Card */}
        <Card className="md:col-span-1 border-border/80 bg-card/80 shadow-sm backdrop-blur-xs flex flex-col items-center p-6 text-center">
          <div className="relative mb-4">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={user.name}
                className="h-28 w-28 rounded-full border-4 border-primary/20 object-cover shadow-md"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/20 bg-primary/10 text-3xl font-bold text-primary shadow-md">
                {initials(user.name)}
              </div>
            )}
          </div>

          <h2 className="text-lg font-semibold text-foreground">{user.name}</h2>
          <p className="text-xs text-muted-foreground mb-3">{user.email}</p>

          <Badge
            variant={isSuper ? "default" : "secondary"}
            className={isSuper ? "shadow-sm shadow-primary/25" : ""}
          >
            <RoleIcon className="mr-1.5 h-3.5 w-3.5" />
            {getRoleLabel(user.role)}
          </Badge>

          <div className="w-full mt-6 pt-5 border-t border-border/60 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Status</span>
              <span className="flex items-center text-emerald-600 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {"createdAt" in user && user.createdAt && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-mono text-muted-foreground">
                  {new Date(user.createdAt as string).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </Card>

        {/* Right Column: Account Details & Change Password */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-primary" />
                Account Information
              </CardTitle>
              <CardDescription>Details associated with your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5" /> Full Name
                  </span>
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                </div>

                <div className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> Email Address
                  </span>
                  <p className="text-sm font-medium text-foreground">{user.email}</p>
                </div>

                <div className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" /> Assigned Role
                  </span>
                  <p className="text-sm font-medium text-foreground">{getRoleLabel(user.role)}</p>
                </div>

                <div className="space-y-1 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" /> Password Status
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {user.mustChangePassword ? "Reset required on login" : "Up to date"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Embedded Change Password */}
          <ProfilePasswordForm />
        </div>
      </div>
    </div>
  );
}

export default ProfileView;
