"use client";

import { useQuery } from "@tanstack/react-query";
import { authService, AUTH_ME_KEY } from "@/api/auth.api";

/**
 * Returns the current authenticated user. The (mainapp) layout already
 * populates the AUTH_ME_KEY cache, so this resolves instantly there.
 */
export function useAuthUser() {
  const { data, isPending } = useQuery({
    queryKey: AUTH_ME_KEY,
    queryFn: authService.me,
    retry: false,
  });
  return { user: data?.user ?? null, isPending };
}
