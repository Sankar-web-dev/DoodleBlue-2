"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
  Course,
} from "@/api/courses.api";
import { ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function EditCourseDialog({
  course,
  onClose,
}: {
  course: Course | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Re-seed the inputs whenever a different row is opened.
  useEffect(() => {
    setName(course?.name ?? "");
    setDescription(course?.description ?? "");
    setFormError(null);
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: () =>
      coursesService.updateCourse(course!.id, {
        name: name.trim(),
        description: description.trim() ? description.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success("Course updated");
      onClose();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      setFormError("Enter a course name (min 2 characters).");
      return;
    }
    setFormError(null);
    updateMutation.mutate();
  };

  return (
    <Dialog open={course !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit course</DialogTitle>
          <DialogDescription>
            Code <span className="font-mono">{course?.code}</span> and
            department stay the same — only the name and description can
            change.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="edit-course-name">Course name</Label>
            <Input
              id="edit-course-name"
              className="h-11 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-course-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="edit-course-desc"
              className="h-11 rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={updateMutation.isPending}
            />
          </div>

          {formError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteCourseDialog({
  course,
  onClose,
  onDeactivate,
}: {
  course: Course | null;
  onClose: () => void;
  onDeactivate: (course: Course) => void;
}) {
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [inUse, setInUse] = useState(false);

  useEffect(() => {
    setFormError(null);
    setInUse(false);
  }, [course]);

  const deleteMutation = useMutation({
    mutationFn: () => coursesService.deleteCourse(course!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      toast.success("Course deleted");
      onClose();
    },
    onError: (error) => {
      if (error instanceof ApiRequestError && error.code === "COURSE_IN_USE") {
        setInUse(true);
        setFormError(error.message);
      } else {
        setFormError(
          error instanceof ApiRequestError
            ? error.message
            : "Something went wrong. Please try again."
        );
      }
    },
  });

  return (
    <Dialog open={course !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Delete {course?.name}?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the course. If enrollments still
            reference it, deactivate it instead to keep their history.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {formError}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          {inUse && course?.isActive && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => course && onDeactivate(course)}
            >
              Deactivate instead
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
