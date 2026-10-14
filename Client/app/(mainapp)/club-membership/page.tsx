import { MembershipsView } from "./_components/memberships-view";

import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function ClubMembershipPage() {
  return (
    <RequirePermission resource="clubMemberships">
      <MembershipsView />
    </RequirePermission>
  );
}
