import { api } from "@/lib/api";

export interface RolePermission {
  resource: string;
  actions: ("create" | "read" | "update" | "delete")[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  /** Role name string — "SUPER_ADMIN" for the system account, role name otherwise. */
  role: string;
  roleId?: string;
  studentId?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  /** Granular permissions from the user's role. Empty for SUPER_ADMIN (implicit full access). */
  permissions: RolePermission[];
}

/** Display label for common known roles. Falls back to the raw name for custom roles. */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STUDENT: "Student",
  };
  return labels[role] ?? role;
}

export const authApi = {
  signIn: (email: string, password: string) =>
    api.post<{ user: AuthUser }>("/api/v1/auth/login", { email, password }),

  signOut: () => api.post<{ message: string }>("/api/v1/auth/logout"),

  me: () => api.get<{ user: AuthUser }>("/api/v1/auth/me"),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.patch<{ message: string }>("/api/v1/auth/change-password", {
      currentPassword,
      newPassword,
    }),
};

export const authService = authApi;
export const AUTH_ME_KEY = ["auth", "me"] as const;
