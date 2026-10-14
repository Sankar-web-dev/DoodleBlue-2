import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function UsersPage() {
  return (
    <RequirePermission resource="users">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage user accounts and role assignments.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
