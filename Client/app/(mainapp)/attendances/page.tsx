import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function AttendancesPage() {
  return (
    <RequirePermission resource="attendance">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mark and review event attendance.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
