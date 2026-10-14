import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";
import { AttendancesView } from "./_components/attendances-view";

export default function AttendancesPage() {
  return (
    <RequirePermission resource="attendance">
      <AttendancesView />
    </RequirePermission>
  );
}
