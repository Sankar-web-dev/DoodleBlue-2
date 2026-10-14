import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  eventRegistrationsApi,
  REGISTRATIONS_LIST_KEY,
  type ListRegistrationsParams,
} from "@/api/event-registrations.api";
import {
  registerForEventAction,
  reviewRegistrationAction,
  cancelRegistrationAction,
  deleteRegistrationAction,
} from "../_actions/registrations.actions";

export function useRegistrations(params: ListRegistrationsParams = {}) {
  return useQuery({
    queryKey: [...REGISTRATIONS_LIST_KEY, params],
    queryFn: () => eventRegistrationsApi.listRegistrations({ limit: 100, ...params }),
  });
}

function useInvalidateRegistrations() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: REGISTRATIONS_LIST_KEY });
}

export function useRegisterForEvent(onSuccess?: () => void) {
  const invalidate = useInvalidateRegistrations();
  return useMutation({
    mutationFn: (eventId: string) => registerForEventAction(eventId),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useReviewRegistration(onSuccess?: () => void) {
  const invalidate = useInvalidateRegistrations();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: "APPROVED" | "REJECTED";
      reason?: string;
    }) => reviewRegistrationAction(id, status, reason),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useCancelRegistration(onSuccess?: () => void) {
  const invalidate = useInvalidateRegistrations();
  return useMutation({
    mutationFn: (id: string) => cancelRegistrationAction(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useDeleteRegistration(onSuccess?: () => void) {
  const invalidate = useInvalidateRegistrations();
  return useMutation({
    mutationFn: (id: string) => deleteRegistrationAction(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
