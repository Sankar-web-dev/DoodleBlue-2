import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function ClubMembershipPage() {
  return (
    <RequirePermission resource="clubMemberships">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Club Memberships</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage club members and student coordinators.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
