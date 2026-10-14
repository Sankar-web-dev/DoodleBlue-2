import { api, PaginationMeta } from "@/lib/api";

export const EVENT_TYPES = ["CLUB", "GENERAL"] as const;
export const EVENT_STATUSES = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
  "CANCELLED",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Named `EventItem` to avoid clashing with the DOM `Event` type. */
export interface EventItem {
  id: string;
  title: string;
  description: string;
  eventType: EventType;
  clubId?: string;
  venue: string;
  startAt: string;
  endAt: string;
  registrationDeadline?: string;
  capacity?: number;
  createdBy: string;
  status: EventStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  eventType: EventType;
  clubId?: string;
  venue: string;
  startAt: string;
  endAt: string;
  registrationDeadline?: string;
  capacity?: number;
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  eventType?: EventType;
  clubId?: string | null;
  venue?: string;
  startAt?: string;
  endAt?: string;
  registrationDeadline?: string | null;
  capacity?: number | null;
}

export interface ListEventsParams {
  search?: string;
  eventType?: EventType;
  clubId?: string;
  status?: EventStatus;
  page?: number;
  limit?: number;
}

export const eventsApi = {
  createEvent: (input: CreateEventInput) =>
    api.post<{ event: EventItem }>("/api/v1/events", input),

  updateEvent: (id: string, input: UpdateEventInput) =>
    api.patch<{ event: EventItem }>(`/api/v1/events/${id}`, input),

  deleteEvent: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/events/${id}`),

  getEvent: (id: string) =>
    api.get<{ event: EventItem }>(`/api/v1/events/${id}`),

  listEvents: (params: ListEventsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.eventType) qs.set("eventType", params.eventType);
    if (params.clubId) qs.set("clubId", params.clubId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<EventItem[], PaginationMeta>(
      `/api/v1/events${query ? `?${query}` : ""}`
    );
  },

  // Status transitions
  submitEvent: (id: string) =>
    api.post<{ event: EventItem }>(`/api/v1/events/${id}/submit`),

  approveEvent: (id: string) =>
    api.post<{ event: EventItem }>(`/api/v1/events/${id}/approve`),

  rejectEvent: (id: string, rejectionReason: string) =>
    api.post<{ event: EventItem }>(`/api/v1/events/${id}/reject`, {
      rejectionReason,
    }),

  publishEvent: (id: string) =>
    api.post<{ event: EventItem }>(`/api/v1/events/${id}/publish`),

  cancelEvent: (id: string) =>
    api.post<{ event: EventItem }>(`/api/v1/events/${id}/cancel`),
};

export const eventsService = eventsApi;
export const EVENTS_LIST_KEY = ["events", "list"] as const;
