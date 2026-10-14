"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { CLUBS_LIST_KEY } from "@/api/clubs.api";
import type { Club } from "@/api/clubs.api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createClubAction,
  updateClubAction,
} from "../_actions/clubs.actions";

interface ClubFormProps {
  /** Pass an existing club to edit it; undefined = create mode */
  club?: Club;
}

export function ClubForm({ club }: ClubFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!club;

  const [name, setName] = useState(club?.name ?? "");
  const [description, setDescription] = useState(club?.description ?? "");
  const [department, setDepartment] = useState(club?.department ?? "");
  const [logoUrl, setLogoUrl] = useState(club?.logoUrl ?? "");
  const [facultyCoordinatorId, setFacultyCoordinatorId] = useState(
    club?.facultyCoordinatorId ?? ""
  );
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: () =>
      createClubAction({
        name: name.trim(),
        description: description.trim(),
        department: department.trim(),
        logoUrl: logoUrl.trim() || undefined,
        facultyCoordinatorId: facultyCoordinatorId.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_LIST_KEY });
      router.push("/clubs");
    },
    onError: (err: Error) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateClubAction(club!.id, {
        name: name.trim(),
        description: description.trim(),
        department: department.trim(),
        logoUrl: logoUrl.trim() ? logoUrl.trim() : null,
        facultyCoordinatorId: facultyCoordinatorId.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLUBS_LIST_KEY });
      router.push("/clubs");
    },
    onError: (err: Error) => setError(err.message),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Club name is required.");
      return;
    }
    if (!department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!facultyCoordinatorId.trim()) {
      setError("Faculty coordinator ID is required.");
      return;
    }
    if (isEdit) updateMutation.mutate();
    else createMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="club-name">Club name</Label>
        <Input
          id="club-name"
          placeholder="e.g. Coding Club"
          className="h-11 rounded-xl"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Department */}
      <div className="space-y-2">
        <Label htmlFor="club-dept">Department</Label>
        <Input
          id="club-dept"
          placeholder="e.g. Computer Science"
          className="h-11 rounded-xl"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Faculty coordinator */}
      <div className="space-y-2">
        <Label htmlFor="club-faculty">Faculty coordinator ID</Label>
        <Input
          id="club-faculty"
          placeholder="User ID of the faculty coordinator"
          className="h-11 rounded-xl"
          value={facultyCoordinatorId}
          onChange={(e) => setFacultyCoordinatorId(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="club-desc">
          Description <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="club-desc"
          placeholder="Short description of the club"
          className="h-11 rounded-xl"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
        />
      </div>

      {/* Logo URL */}
      <div className="space-y-2">
        <Label htmlFor="club-logo">
          Logo URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="club-logo"
          type="url"
          placeholder="https://…"
          className="h-11 rounded-xl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/clubs")}
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
          {isEdit ? "Save changes" : "Create club"}
        </Button>
      </div>
    </form>
  );
}
