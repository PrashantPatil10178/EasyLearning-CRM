"use client";

import { api } from "@/trpc/react";
import type { LeadCategory } from "@/lib/lead-status";

export interface CustomStatusOption {
  id: string;
  value: string;
  label: string;
  color: string;
  isDefault: boolean;
}

export interface CustomCategoryConfig {
  value: LeadCategory;
  label: string;
  statuses: CustomStatusOption[];
}

type LeadStatusConfig = {
  id: string;
  name: string;
  color: string | null;
  isDefault: boolean;
  stage: string;
  order: number;
};

/**
 * Hook to fetch and format custom lead statuses from the database
 * Returns statuses grouped by category (Fresh/Active/Closed)
 */
export function useLeadStatuses() {
  const { data: statusesByStage, isLoading } =
    api.leadStatus.getByStage.useQuery();

  const categories: CustomCategoryConfig[] = [
    {
      value: "FRESH",
      label: "Fresh",
      statuses:
        statusesByStage?.INITIAL.map((s: LeadStatusConfig) => ({
          id: s.id,
          value: s.name,
          label: s.name,
          color: s.color ?? "#E5E7EB",
          isDefault: s.isDefault,
        })) ?? [],
    },
    {
      value: "ACTIVE",
      label: "Active",
      statuses:
        statusesByStage?.ACTIVE.map((s: LeadStatusConfig) => ({
          id: s.id,
          value: s.name,
          label: s.name,
          color: s.color ?? "#D1D5DB",
          isDefault: s.isDefault,
        })) ?? [],
    },
    {
      value: "CLOSED",
      label: "Closed",
      statuses:
        statusesByStage?.CLOSED.map((s: LeadStatusConfig) => ({
          id: s.id,
          value: s.name,
          label: s.name,
          color: s.color ?? "#E5E7EB",
          isDefault: s.isDefault,
        })) ?? [],
    },
  ];

  // Flat list of all statuses
  const allStatuses = categories.flatMap((cat) => cat.statuses);

  return {
    categories,
    allStatuses,
    isLoading,
  };
}
