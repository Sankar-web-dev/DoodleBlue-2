import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";

export default function EventsPage() {
  return (
    <RequirePermission resource="events">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Events</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage club and college-wide events.
          </p>
        </div>
      </div>
    </RequirePermission>
  );
}
