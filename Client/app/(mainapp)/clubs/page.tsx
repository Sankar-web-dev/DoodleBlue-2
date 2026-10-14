import { ClubsView } from "./_components/clubs-view";
import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function ClubsPage() {
  return (
    <RequirePermission resource="clubs">
      <ClubsView />
    </RequirePermission>
  );
}
