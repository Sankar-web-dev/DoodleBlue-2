"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Loader2, Trash2, Upload } from "lucide-react";

import { clubsApi, CLUBS_LIST_KEY } from "@/api/clubs.api";
import type { Club } from "@/api/clubs.api";
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
import { useUserOptions } from "../../users/_hooks/use-users";
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

  const { data: users, isLoading: usersLoading, error: usersError } =
    useUserOptions();
  const userList = users ?? [];
  // Show only active users, but keep the club's current coordinator listed
  // in edit mode even if their account has since been deactivated.
  const selectableUsers = userList.filter(
    (u) => u.isActive || (club && u.id === club.facultyCoordinatorId)
  );

  const [name, setName] = useState(club?.name ?? "");
  const [description, setDescription] = useState(club?.description ?? "");
  const [department, setDepartment] = useState(club?.department ?? "");
  const [logoUrl, setLogoUrl] = useState(club?.logoUrl ?? "");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const isPending =
    createMutation.isPending || updateMutation.isPending || isUploadingImage;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size should not exceed 5MB.");
      return;
    }

    setIsUploadingImage(true);
    setError(null);
    try {
      const res = await clubsApi.uploadClubImage(file);
      setLogoUrl(res.url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to upload club logo."
      );
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
      setError("Club name is required.");
      return;
    }
    if (!department.trim()) {
      setError("Department is required.");
      return;
    }
    if (!facultyCoordinatorId) {
      setError("Please select a faculty coordinator.");
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
        <Label htmlFor="club-faculty">Faculty coordinator</Label>
        <Select
          value={facultyCoordinatorId}
          onValueChange={(val) => {
            setFacultyCoordinatorId(val);
            setError(null);
          }}
          disabled={usersLoading || isPending}
        >
          <SelectTrigger id="club-faculty" className="h-11 rounded-xl w-full">
            <SelectValue
              placeholder={
                usersLoading ? "Loading users…" : "Choose a faculty coordinator"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {selectableUsers.length === 0 ? (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {usersError ? "Could not load users." : "No users found."}
              </p>
            ) : (
              selectableUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <div className="flex items-center gap-2">
                    <span>{u.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {u.email}
                    </span>
                    {!u.isActive && (
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        Inactive
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {usersError && (
          <p className="text-xs text-destructive">
            {usersError instanceof Error
              ? usersError.message
              : "Failed to load users."}
          </p>
        )}
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

      {/* Club logo upload */}
      <div className="space-y-2">
        <Label>
          Club logo <span className="text-muted-foreground">(optional)</span>
        </Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Club logo preview"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/30">
              <Camera className="h-6 w-6 text-muted-foreground" />
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
          >
            {isUploadingImage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {logoUrl ? "Change logo" : "Upload logo"}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setLogoUrl("")}
              disabled={isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>
        <Input
          id="club-logo-url"
          placeholder="…or paste an image URL"
          className="h-11 rounded-xl"
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Accepted formats: JPEG, PNG, WEBP, GIF (max 5MB).
        </p>
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
