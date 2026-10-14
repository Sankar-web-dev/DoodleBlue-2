import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function EventRegistrationPage() {
  return (
    <RequirePermission resource="eventRegistrations">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Event Registrations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage event sign-ups.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
