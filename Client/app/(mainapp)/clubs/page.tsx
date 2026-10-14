import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function ClubsPage() {
  return (
    <RequirePermission resource="clubs">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clubs</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage college clubs and their faculty coordinators.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
