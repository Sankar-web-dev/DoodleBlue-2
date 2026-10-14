import { eventsApi } from "@/api/events.api";
import type {
  CreateEventInput,
  UpdateEventInput,
} from "@/api/events.api";

export async function createEventAction(input: CreateEventInput) {
  return eventsApi.createEvent({
    ...input,
    title: input.title.trim(),
    description: input.description?.trim(),
    venue: input.venue.trim(),
  });
}

export async function updateEventAction(id: string, input: UpdateEventInput) {
  return eventsApi.updateEvent(id, {
    ...input,
    title: input.title?.trim(),
    description: input.description?.trim(),
    venue: input.venue?.trim(),
  });
}

export async function deleteEventAction(id: string) {
  return eventsApi.deleteEvent(id);
}

export async function submitEventAction(id: string) {
  return eventsApi.submitEvent(id);
}

export async function approveEventAction(id: string) {
  return eventsApi.approveEvent(id);
}

export async function rejectEventAction(id: string, rejectionReason: string) {
  return eventsApi.rejectEvent(id, rejectionReason.trim());
}

export async function publishEventAction(id: string) {
  return eventsApi.publishEvent(id);
}

export async function cancelEventAction(id: string) {
  return eventsApi.cancelEvent(id);
}
