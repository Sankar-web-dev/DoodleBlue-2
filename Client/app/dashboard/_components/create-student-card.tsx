"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GraduationCap,
  KeyRound,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Building2,
  Hash,
  ChevronDown,
} from "lucide-react";

import {
  studentsService,
  STUDENTS_LIST_KEY,
} from "@/api/students.api";
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
import { generatePassword } from "./console-utils";

function suggestStudentNumber(): string {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  return `STU-${year}-${seq}`;
}

export function CreateStudentDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { departments, isPending: deptsPending } = useDepartments();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
    studentNumber: string;
  } | null>(null);

  // Auto-select the first active department so enrollment works out of the box.
  useEffect(() => {
    if (!departmentId && departments.length > 0) {
      setDepartmentId(departments[0].id);
    }
  }, [departments, departmentId]);

  const createMutation = useMutation({
    mutationFn: () =>
      studentsService.createStudent({
        fullName: fullName.trim(),
        email: email.trim(),
        studentNumber: studentNumber.trim(),
        departmentId,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        temporaryPassword: password,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_LIST_KEY });
      setCreated({
        email: email.trim(),
        password,
        studentNumber: studentNumber.trim(),
      });
      setFullName("");
      setEmail("");
      setStudentNumber(suggestStudentNumber());
      setPhone("");
      setPassword(generatePassword());
      setFormError(null);
      toast.success("Student enrolled", {
        description: "Share the credentials with the student.",
      });
    },
    onError: (error) => {
      setCreated(null);
      setFormError(
        error instanceof ApiRequestError
          ? error.code === "EMAIL_IN_USE"
            ? "That email is already registered."
            : error.code === "STUDENT_NUMBER_IN_USE"
              ? "That student number is already taken."
              : error.message
          : "Something went wrong. Please try again."
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullName.trim().length < 2) {
      setFormError("Enter the student's full name.");
      return;
    }
    if (!email.trim()) {
      setFormError("Enter an email address.");
      return;
    }
    if (studentNumber.trim().length < 3) {
      setFormError("Enter a student number (min 3 characters).");
      return;
    }
    if (!departmentId) {
      setFormError("Pick a department.");
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
      `Student number: ${created.studentNumber}\nEmail: ${created.email}\nTemporary password: ${created.password}`
    );
    toast.success("Credentials copied");
  };

  const closeAndReset = () => {
    onClose();
    setFullName("");
    setEmail("");
    setStudentNumber("");
    setDepartmentId("");
    setPhone("");
    setPassword("");
    setShowPassword(false);
    setFormError(null);
    setCreated(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeAndReset()}>
      <DialogContent className="sm:max-w-lg max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Create student
          </DialogTitle>
          <DialogDescription>
            Creates the student profile and their sign-in account. Share the
            credentials — they can log in right away.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stu-name">Full name</Label>
              <Input
                id="stu-name"
                placeholder="e.g. Arun Kumar"
                className="h-11 rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stu-number">Student number</Label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stu-number"
                  placeholder="STU-2026-0001"
                  className="h-11 rounded-xl pl-10 pr-10 font-mono text-sm"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  disabled={createMutation.isPending}
                />
                <button
                  type="button"
                  onClick={() => setStudentNumber(suggestStudentNumber())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Suggest student number"
                  title="Suggest student number"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stu-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stu-email"
                type="email"
                placeholder="student@school.com"
                className="h-11 rounded-xl pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={createMutation.isPending}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stu-dept">Department</Label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  id="stu-dept"
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
                  No departments yet — run{" "}
                  <code className="font-mono">pnpm seed:dept</code> in Server to
                  create a default one.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stu-phone">
                Phone <span className="text-muted-foreground">(optional)</span>
              </Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stu-phone"
                  placeholder="9876543210"
                  className="h-11 rounded-xl pl-10"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={createMutation.isPending}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stu-password">Temporary password</Label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stu-password"
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
                Enrolling…
              </>
            ) : (
              <>
                <GraduationCap className="h-4 w-4" />
                Create student
              </>
            )}
          </Button>
        </form>

        {created && (
          <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              Student enrolled — share these credentials
            </p>
            <div className="space-y-1 font-mono text-xs text-foreground/80">
              <p>Student no: {created.studentNumber}</p>
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
