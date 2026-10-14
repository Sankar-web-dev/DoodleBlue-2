import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventsApi, EVENTS_LIST_KEY } from "@/api/events.api";
import type { ListEventsParams } from "@/api/events.api";
import {
  approveEventAction,
  cancelEventAction,
  deleteEventAction,
  publishEventAction,
  rejectEventAction,
  submitEventAction,
} from "../_actions/events.actions";

export function useEvents(params: ListEventsParams = {}) {
  return useQuery({
    queryKey: [...EVENTS_LIST_KEY, params],
    queryFn: () => eventsApi.listEvents({ limit: 100, ...params }),
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: () => eventsApi.getEvent(id),
    enabled: !!id,
  });
}

function useInvalidateEvents() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: EVENTS_LIST_KEY });
    queryClient.invalidateQueries({ queryKey: ["events", "detail"] });
  };
}

export function useDeleteEvent(onSuccess?: () => void) {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: (id: string) => deleteEventAction(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export type EventTransition = "submit" | "approve" | "publish" | "cancel";

const TRANSITIONS: Record<EventTransition, (id: string) => Promise<unknown>> = {
  submit: submitEventAction,
  approve: approveEventAction,
  publish: publishEventAction,
  cancel: cancelEventAction,
};

/** One mutation for all status-change endpoints that take only an id. */
export function useEventTransition(onSuccess?: () => void) {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: EventTransition }) =>
      TRANSITIONS[action](id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useRejectEvent(onSuccess?: () => void) {
  const invalidate = useInvalidateEvents();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectEventAction(id, reason),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
