import { eventRegistrationsApi } from "@/api/event-registrations.api";

export async function registerForEventAction(eventId: string) {
  return eventRegistrationsApi.register(eventId);
}

export async function reviewRegistrationAction(
  id: string,
  status: "APPROVED" | "REJECTED",
  rejectionReason?: string
) {
  return eventRegistrationsApi.reviewRegistration(id, {
    status,
    rejectionReason: rejectionReason?.trim() || undefined,
  });
}

export async function cancelRegistrationAction(id: string) {
  return eventRegistrationsApi.cancelRegistration(id);
}

export async function deleteRegistrationAction(id: string) {
  return eventRegistrationsApi.deleteRegistration(id);
}
