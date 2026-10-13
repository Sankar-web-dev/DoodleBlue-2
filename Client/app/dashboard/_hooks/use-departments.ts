"use client";

import { useQuery } from "@tanstack/react-query";

import {
  departmentsService,
  DEPARTMENTS_LIST_KEY,
} from "@/api/departments.api";

export function useDepartments() {
  const { data, isPending } = useQuery({
    queryKey: [...DEPARTMENTS_LIST_KEY, "active"],
    queryFn: () =>
      departmentsService.listDepartments({ isActive: true, limit: 100 }),
  });
  return { departments: data?.data ?? [], isPending };
}
