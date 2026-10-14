import { api, PaginationMeta } from "@/lib/api";

export const REGISTRATION_STATUSES = [
  "REGISTERED",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export interface EventRegistration {
  id: string;
  eventId: string;
  studentId: string;
  /** Populated by the server — saves clients needing events:read/users:read. */
  event?: {
    id: string;
    title: string;
    eventType: "CLUB" | "GENERAL";
    venue: string;
    startAt: string;
  };
  student?: { id: string; name: string; email: string };
  status: RegistrationStatus;
  reviewedBy?: string;
  reviewedByUser?: { id: string; name: string };
  reviewedAt?: string;
  rejectionReason?: string;
  registeredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewRegistrationInput {
  status: "APPROVED" | "REJECTED";
  rejectionReason?: string;
}

export interface ListRegistrationsParams {
  eventId?: string;
  studentId?: string;
  status?: RegistrationStatus;
  page?: number;
  limit?: number;
}

export const eventRegistrationsApi = {
  register: (eventId: string) =>
    api.post<{ registration: EventRegistration }>(
      "/api/v1/event-registrations",
      { eventId }
    ),

  listRegistrations: (params: ListRegistrationsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.eventId) qs.set("eventId", params.eventId);
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<EventRegistration[], PaginationMeta>(
      `/api/v1/event-registrations${query ? `?${query}` : ""}`
    );
  },

  getRegistration: (id: string) =>
    api.get<{ registration: EventRegistration }>(
      `/api/v1/event-registrations/${id}`
    ),

  /** Coordinator / faculty / super admin decision on a PENDING registration. */
  reviewRegistration: (id: string, input: ReviewRegistrationInput) =>
    api.patch<{ registration: EventRegistration }>(
      `/api/v1/event-registrations/${id}`,
      input
    ),

  cancelRegistration: (id: string) =>
    api.post<{ registration: EventRegistration }>(
      `/api/v1/event-registrations/${id}/cancel`
    ),

  deleteRegistration: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/event-registrations/${id}`),
};

export const eventRegistrationsService = eventRegistrationsApi;
export const REGISTRATIONS_LIST_KEY = ["event-registrations", "list"] as const;
