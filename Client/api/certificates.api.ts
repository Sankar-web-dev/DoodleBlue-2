import { api, PaginationMeta } from "@/lib/api";

export const CERTIFICATE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "ISSUED",
] as const;

export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export interface CertificateItem {
  id: string;
  eventId: string;
  studentId: string;
  issuedBy: string;
  approvedBy?: string;
  status: CertificateStatus;
  certificateNumber?: string;
  certificateUrl?: string;
  approvedAt?: string;
  issuedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestCertificateInput {
  eventId: string;
  studentId: string;
}

export interface UpdateCertificateInput {
  status: "APPROVED" | "REJECTED" | "ISSUED";
  rejectionReason?: string;
  certificateUrl?: string;
}

export interface ListCertificatesParams {
  eventId?: string;
  studentId?: string;
  status?: CertificateStatus;
  page?: number;
  limit?: number;
}

export const certificatesApi = {
  requestCertificate: (input: RequestCertificateInput) =>
    api.post<{ certificate: CertificateItem }>("/api/v1/certificates", input),

  updateCertificate: (id: string, input: UpdateCertificateInput) =>
    api.patch<{ certificate: CertificateItem }>(
      `/api/v1/certificates/${id}`,
      input
    ),

  deleteCertificate: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/certificates/${id}`),

  getCertificate: (id: string) =>
    api.get<{ certificate: CertificateItem }>(`/api/v1/certificates/${id}`),

  listCertificates: (params: ListCertificatesParams = {}) => {
    const qs = new URLSearchParams();
    if (params.eventId) qs.set("eventId", params.eventId);
    if (params.studentId) qs.set("studentId", params.studentId);
    if (params.status) qs.set("status", params.status);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<CertificateItem[], PaginationMeta>(
      `/api/v1/certificates${query ? `?${query}` : ""}`
    );
  },
};

export const certificatesService = certificatesApi;
export const CERTIFICATES_LIST_KEY = ["certificates", "list"] as const;
