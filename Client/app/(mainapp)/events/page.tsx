import { EventsView } from "./_components/events-view";
import { RequirePermission } from "../_components/require-permission";

export default function EventsPage() {
  return (
    <RequirePermission resource="events">
      <EventsView />
    </RequirePermission>
  );
}
