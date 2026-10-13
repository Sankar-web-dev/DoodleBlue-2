"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen,
  Loader2,
  Hash,
  Building2,
  ChevronDown,
} from "lucide-react";

import {
  coursesService,
  COURSES_LIST_KEY,
} from "@/api/courses.api";
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
import { useDepartments } from "../_hooks/use-departments";

export function CreateCourseDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { departments, isPending: deptsPending } = useDepartments();

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-select the first active department so creation works out of the box.
  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const createMutation = useMutation({
    mutationFn: () =>
      coursesService.createCourse({
        name: name.trim(),
        code: code.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
        departmentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSES_LIST_KEY });
      setName("");
      setCode("");
      setDescription("");
      setFormError(null);
      toast.success("Course created");
      onClose();
    },
    onError: (error) => {
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "CODE_IN_USE"
            ? "That code is already taken by another course."
            : error.code === "DEPARTMENT_INACTIVE"
              ? "That department is inactive — activate it first."
              : error.message
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
    if (!/^[A-Za-z0-9-]{2,20}$/.test(code.trim())) {
      setFormError(
        "Enter a code — 2 to 20 letters, numbers or hyphens (e.g. CS101)."
      );
      return;
    }
    if (!departmentId) {
      setFormError("Pick a department.");
      return;
    }
    setFormError(null);
    createMutation.mutate();
  };

  const closeAndReset = () => {
    onClose();
    setName("");
    setCode("");
    setDescription("");
    setFormError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Create course
          </DialogTitle>
          <DialogDescription>
            Courses live inside a department. The code is a short unique
            identifier and can&apos;t be changed later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="course-name">Course name</Label>
              <Input
                id="course-name"
                placeholder="e.g. Data Structures"
                className="h-11 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-code">Code</Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="course-code"
                  placeholder="CS101"
                  className="h-11 rounded-xl pl-10 font-mono text-sm uppercase"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-dept">Department</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                id="course-dept"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-11 w-full appearance-none rounded-xl border pl-10 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={createMutation.isPending || deptsPending}
              >
                <option value="">
                  {deptsPending ? "Loading…" : "Select department"}
                </option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            {!deptsPending && departments.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No active departments — create one in the Departments section
                first.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              id="course-desc"
              placeholder="Short description"
              className="h-11 rounded-xl"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createMutation.isPending}
            />
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
                <BookOpen className="h-4 w-4" />
                Create course
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
