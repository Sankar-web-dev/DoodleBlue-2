import { RequirePermission } from "@/app/(mainapp)/_components/require-permission";
import { RegistrationsView } from "./_components/registrations-view";

export default function EventRegistrationPage() {
  return (
    <RequirePermission resource="eventRegistrations">
      <RegistrationsView />
    </RequirePermission>
  );
}
