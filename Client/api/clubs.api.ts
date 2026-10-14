import { api, PaginationMeta } from "@/lib/api";

export interface Club {
  id: string;
  name: string;
  description: string;
  department: string;
  logoUrl?: string;
  facultyCoordinatorId: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClubInput {
  name: string;
  description?: string;
  department: string;
  logoUrl?: string;
  facultyCoordinatorId: string;
}

export interface UpdateClubInput {
  name?: string;
  description?: string;
  department?: string;
  logoUrl?: string | null;
  facultyCoordinatorId?: string;
  isActive?: boolean;
}

export interface ListClubsParams {
  search?: string;
  department?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export const clubsApi = {
  createClub: (input: CreateClubInput) =>
    api.post<{ club: Club }>("/api/v1/clubs", input),

  updateClub: (id: string, input: UpdateClubInput) =>
    api.patch<{ club: Club }>(`/api/v1/clubs/${id}`, input),

  approveClub: (id: string) =>
    api.patch<{ club: Club }>(`/api/v1/clubs/${id}/approve`),

  deleteClub: (id: string) =>
    api.delete<{ message: string }>(`/api/v1/clubs/${id}`),

  getClub: (id: string) =>
    api.get<{ club: Club }>(`/api/v1/clubs/${id}`),

  listClubs: (params: ListClubsParams = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.department) qs.set("department", params.department);
    if (params.isActive !== undefined) qs.set("isActive", String(params.isActive));
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const query = qs.toString();
    return api.getWithMeta<Club[], PaginationMeta>(
      `/api/v1/clubs${query ? `?${query}` : ""}`
    );
  },
};

export const clubsService = clubsApi;
export const CLUBS_LIST_KEY = ["clubs", "list"] as const;
