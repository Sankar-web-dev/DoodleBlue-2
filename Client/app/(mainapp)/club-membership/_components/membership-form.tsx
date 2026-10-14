"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { MEMBERSHIPS_LIST_KEY } from "@/api/club-memberships.api";
import type {
  ClubMembership,
  MembershipRole,
  MembershipStatus,
} from "@/api/club-memberships.api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useClubs, useUsers } from "../_hooks/use-memberships";
import {
  createMembershipAction,
  updateMembershipAction,
} from "../_actions/memberships.actions";

interface MembershipFormProps {
  /** Pass an existing membership to edit it; undefined = create mode */
  membership?: ClubMembership;
}

export function MembershipForm({ membership }: MembershipFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!membership;

  const clubsQuery = useClubs();
  const usersQuery = useUsers();

  const clubs = (clubsQuery.data?.data ?? []).filter((c) => c.isActive);
  const students = (usersQuery.data?.data.users ?? []).filter(
    (u) => u.isActive
  );

  const [clubId, setClubId] = useState(membership?.clubId ?? "");
  const [studentId, setStudentId] = useState(membership?.studentId ?? "");
  const [membershipRole, setMembershipRole] = useState<MembershipRole>(
    membership?.membershipRole ?? "MEMBER"
  );
  const [status, setStatus] = useState<MembershipStatus>(
    membership?.status ?? "ACTIVE"
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () => createMembershipAction(clubId, studentId, membershipRole),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_LIST_KEY });
      router.push("/club-membership");
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateMembershipAction(membership!.id, membershipRole, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBERSHIPS_LIST_KEY });
      router.push("/club-membership");
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const lookupsLoading = clubsQuery.isPending || usersQuery.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isEdit) {
      if (!clubId) {
        setError("Select a club.");
        return;
      }
      if (!studentId) {
        setError("Select a member.");
        return;
      }
    }

    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  }

  // In edit mode the pair is immutable — show the resolved names read-only.
  const editClubName =
    clubsQuery.data?.data.find((c) => c.id === membership?.clubId)?.name ??
    membership?.clubId;
  const editStudentName =
    usersQuery.data?.data.users.find((u) => u.id === membership?.studentId)
      ?.name ?? membership?.studentId;

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

          {/* Member */}
          <div className="space-y-2">
            <Label htmlFor="ms-student" required>
              Member
            </Label>
            <Select
              value={studentId}
              onValueChange={setStudentId}
              disabled={isPending || lookupsLoading}
            >
              <SelectTrigger id="ms-student" className="h-11 rounded-xl">
                <SelectValue
                  placeholder={
                    lookupsLoading ? "Loading users…" : "Select a member"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} — {user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Club role */}
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
            Each club has at most one active coordinator — promoting this member
            demotes the current coordinator to a regular member.
          </p>
        )}
      </div>

      {/* Status — edit only; create always starts ACTIVE */}
      {isEdit && (
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
