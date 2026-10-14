import { certificatesApi } from "@/api/certificates.api";
import type {
  RequestCertificateInput,
  UpdateCertificateInput,
} from "@/api/certificates.api";

export async function requestCertificateAction(
  input: RequestCertificateInput
) {
  return certificatesApi.requestCertificate(input);
}

export async function approveCertificateAction(id: string) {
  return certificatesApi.updateCertificate(id, { status: "APPROVED" });
}

export async function rejectCertificateAction(
  id: string,
  rejectionReason: string
) {
  return certificatesApi.updateCertificate(id, {
    status: "REJECTED",
    rejectionReason: rejectionReason.trim(),
  });
}

export async function issueCertificateAction(id: string, certificateUrl?: string) {
  const input: UpdateCertificateInput = { status: "ISSUED" };
  if (certificateUrl?.trim()) input.certificateUrl = certificateUrl.trim();
  return certificatesApi.updateCertificate(id, input);
}

export async function deleteCertificateAction(id: string) {
  return certificatesApi.deleteCertificate(id);
}
