"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { MEMBERSHIPS_LIST_KEY } from "@/api/club-memberships.api";
import type {
  ClubMembership,
  MembershipRole,
  MembershipStatus,
} from "@/api/club-memberships.api";
import { USERS_LIST_KEY } from "@/api/users.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useRoles } from "../../roles/_hooks/use-roles";
import { useClubs } from "../_hooks/use-memberships";
import {
  createMemberWithAccountAction,
  updateMembershipAction,
} from "../_actions/memberships.actions";

/** Role names accepted for auto-provisioned member accounts, in priority order. */
const MEMBER_ROLE_NAMES = ["CLUB MEMBER", "STUDENT", "MEMBER"];

interface MembershipFormProps {
  /** Pass an existing membership to edit it; undefined = create mode */
  membership?: ClubMembership;
}

export function MembershipForm({ membership }: MembershipFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!membership;

  const clubsQuery = useClubs();
  const rolesQuery = useRoles();

  const clubs = (clubsQuery.data?.data ?? []).filter((c) => c.isActive);
  const roles = rolesQuery.data?.data ?? [];
  // New club members are provisioned with the member-level account role.
  const memberRoleId = roles.find(
    (r) => MEMBER_ROLE_NAMES.includes(r.name.toUpperCase()) && r.isActive
  )?.id;

  const [clubId, setClubId] = useState(membership?.clubId ?? "");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [membershipRole, setMembershipRole] = useState<MembershipRole>(
    membership?.membershipRole ?? "MEMBER"
  );
  const [status, setStatus] = useState<MembershipStatus>(
    membership?.status ?? "ACTIVE"
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createMemberWithAccountAction({
        clubId,
        name: name.trim(),
        email: email.trim(),
        password,
        roleId: memberRoleId!,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_LIST_KEY });
      queryClient.invalidateQueries({ queryKey: USERS_LIST_KEY });
      toast.success("Membership added", {
        description: `${name.trim()} added to ${selectedClubName}.`,
      });
      router.push("/club-membership");
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateMembershipAction(membership!.id, membershipRole, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_LIST_KEY });
      toast.success("Membership updated");
      router.push("/club-membership");
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const lookupsLoading = clubsQuery.isPending || rolesQuery.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit) {
      if (!clubId) {
        setError("Select a club.");
        return;
      }
      if (!name.trim()) {
        setError("Member name is required.");
        return;
      }
      if (!email.trim()) {
        setError("Email is required.");
        return;
      }
      if (!password || password.length < 10) {
        setError("Temporary password must be at least 10 characters.");
        return;
      }
      if (!memberRoleId) {
        setError(
          "No active 'Club Member' role found — create one under Roles first."
        );
        return;
      }
      createMutation.mutate();
    } else {
      updateMutation.mutate();
    }
  }

  const selectedClubName =
    clubs.find((c) => c.id === clubId)?.name ?? "the club";

  // In edit mode the pair is immutable — the server populates names for us.
  const editClubName = membership?.club?.name ?? membership?.clubId;
  const editStudentName =
    membership?.student?.name ?? membership?.studentId;

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {isEdit ? (
        <>
          <div className="space-y-2">
            <Label>Club</Label>
            <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
              {editClubName}
            </p>
          </div>
          <div className="space-y-2">
            <Label>Member</Label>
            <p className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2.5 text-sm">
              {editStudentName}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Club */}
          <div className="space-y-2">
            <Label htmlFor="ms-club" required>
              Club
            </Label>
            <Select
              value={clubId}
              onValueChange={setClubId}
              disabled={isPending || lookupsLoading}
            >
              <SelectTrigger id="ms-club" className="h-11 rounded-xl">
                <SelectValue
                  placeholder={
                    lookupsLoading ? "Loading clubs…" : "Select a club"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    {club.name}
                    {club.department ? ` — ${club.department}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Member details — a user account is provisioned inline */}
          <div className="space-y-2">
            <Label htmlFor="ms-name" required>
              Member name
            </Label>
            <Input
              id="ms-name"
              placeholder="e.g. Jane Doe"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-email" required>
              Email address
            </Label>
            <Input
              id="ms-email"
              type="email"
              placeholder="e.g. student@campus.edu"
              className="h-11 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-password" required>
              Temporary password{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (min 10 chars)
              </span>
            </Label>
            <div className="relative">
              <Input
                id="ms-password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••"
                className="h-11 rounded-xl pr-10 font-mono text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              The member will be asked to change this on first login.
            </p>
          </div>

          {/* Club role — static, new members always join as MEMBER */}
          <div className="space-y-2">
            <Label>Club role</Label>
            <div className="flex h-11 items-center rounded-xl border border-border/70 bg-muted/30 px-3.5 text-sm font-medium">
              Club Member
            </div>
            <p className="text-xs text-muted-foreground">
              Members always join as a regular member — promote them to
              coordinator later from Edit.
            </p>
          </div>
        </>
      )}

      {/* Edit-mode fields: club role + status */}
      {isEdit && (
        <>
          <div className="space-y-2">
            <Label htmlFor="ms-role">Club role</Label>
            <Select
              value={membershipRole}
              onValueChange={(v) => setMembershipRole(v as MembershipRole)}
              disabled={isPending}
            >
              <SelectTrigger id="ms-role" className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="COORDINATOR">Coordinator</SelectItem>
              </SelectContent>
            </Select>
            {membershipRole === "COORDINATOR" && (
              <p className="text-xs text-muted-foreground">
                Each club has at most one active coordinator — promoting this
                member demotes the current coordinator.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-status">Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as MembershipStatus)}
              disabled={isPending}
            >
              <SelectTrigger id="ms-status" className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {status === "INACTIVE" && membershipRole === "COORDINATOR" && (
              <p className="text-xs text-muted-foreground">
                Deactivating a coordinator also demotes them to member.
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/club-membership")}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          loading={isPending}
          loadingText={isEdit ? "Saving…" : "Adding…"}
          disabled={lookupsLoading}
        >
          {isEdit ? "Save changes" : "Add membership"}
        </Button>
      </div>
    </form>
  );
}
