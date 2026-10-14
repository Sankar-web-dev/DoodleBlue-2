import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { certificatesApi, CERTIFICATES_LIST_KEY } from "@/api/certificates.api";
import type { ListCertificatesParams } from "@/api/certificates.api";
import {
  approveCertificateAction,
  deleteCertificateAction,
  issueCertificateAction,
  rejectCertificateAction,
  requestCertificateAction,
} from "../_actions/certificates.actions";

export function useCertificates(params: ListCertificatesParams = {}) {
  return useQuery({
    queryKey: [...CERTIFICATES_LIST_KEY, params],
    queryFn: () => certificatesApi.listCertificates({ limit: 100, ...params }),
  });
}

export function useCertificate(id: string) {
  return useQuery({
    queryKey: ["certificates", "detail", id],
    queryFn: () => certificatesApi.getCertificate(id),
    enabled: !!id,
  });
}

function useInvalidateCertificates() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: CERTIFICATES_LIST_KEY });
    queryClient.invalidateQueries({ queryKey: ["certificates", "detail"] });
  };
}

export function useRequestCertificate(onSuccess?: () => void) {
  const invalidate = useInvalidateCertificates();
  return useMutation({
    mutationFn: (input: { eventId: string; studentId: string }) =>
      requestCertificateAction(input),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

/** Faculty decision: approve (PENDING→APPROVED) or issue (APPROVED→ISSUED). */
export function useCertificateDecision(onSuccess?: () => void) {
  const invalidate = useInvalidateCertificates();
  return useMutation({
    mutationFn: ({
      id,
      action,
      certificateUrl,
    }: {
      id: string;
      action: "approve" | "issue";
      certificateUrl?: string;
    }) =>
      action === "approve"
        ? approveCertificateAction(id)
        : issueCertificateAction(id, certificateUrl),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useRejectCertificate(onSuccess?: () => void) {
  const invalidate = useInvalidateCertificates();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      rejectCertificateAction(id, reason),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}

export function useDeleteCertificate(onSuccess?: () => void) {
  const invalidate = useInvalidateCertificates();
  return useMutation({
    mutationFn: (id: string) => deleteCertificateAction(id),
    onSuccess: () => {
      invalidate();
      onSuccess?.();
    },
  });
}
