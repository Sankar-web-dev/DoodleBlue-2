import { api } from "@/lib/api";
import { Enrollment } from "./enrollments.api";

export interface ResourceCounts {
  total: number;
  active: number;
  inactive: number;
}

export interface AnalyticsSummary {
  students: ResourceCounts;
  departments: ResourceCounts;
  courses: ResourceCounts;
  admins: ResourceCounts;
  enrollments: {
    total: number;
    active: number;
    completed: number;
    withdrawn: number;
  };
  recentEnrollments: Enrollment[];
}

export const analyticsApi = {
  // SUPER_ADMIN + ADMIN — institution-wide counts and recent activity.
  getSummary: () => api.get<AnalyticsSummary>("/api/v1/analytics/summary"),
};

export const analyticsService = analyticsApi;
export const ANALYTICS_SUMMARY_KEY = ["analytics", "summary"] as const;
