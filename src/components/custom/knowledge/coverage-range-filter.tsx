"use client";

import {
  DashboardRangeFilter,
  type DashboardFilterState,
} from "@/components/custom/dashboard-filters";
import { useIsBelowLg } from "@/hooks/use-narrow-viewport";

/** The period picker of the coverage views (today, 7 or 30 days, or a range). */
export function CoverageRangeFilter({
  filters,
  onChange,
}: {
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
}) {
  // The calendar is narrower on a phone or tablet.
  const isBelowLg = useIsBelowLg();
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <DashboardRangeFilter
        filters={filters}
        onChange={onChange}
        numberOfMonths={isBelowLg ? 1 : 2}
      />
    </div>
  );
}
