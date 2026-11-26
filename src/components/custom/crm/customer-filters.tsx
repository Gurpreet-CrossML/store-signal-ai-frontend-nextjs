"use client";

import { IconSearch, IconX } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { FilterSelect } from "@/components/custom/thread-filteration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { CustomerOrdering } from "@/redux/api-slice/customer-slice";

/** The list screen's filters; "" means the filter is off. */
export type CustomerFilterState = {
  search: string;
  registeredFrom: string;
  registeredTo: string;
  hasOrders: "" | "true" | "false";
  ordering: CustomerOrdering;
};

export const DEFAULT_CUSTOMER_FILTERS: CustomerFilterState = {
  search: "",
  registeredFrom: "",
  registeredTo: "",
  hasOrders: "",
  ordering: "-total_spent",
};

const SORT_OPTIONS: { value: CustomerOrdering; label: string }[] = [
  { value: "-total_spent", label: "Top Spenders" },
  { value: "-orders_count", label: "Most Orders" },
  { value: "-registered_at", label: "Newest Customers" },
  { value: "registered_at", label: "Oldest Customers" },
  { value: "first_name", label: "Name (A–Z)" },
];

/** True when anything narrows the list; the sort order doesn't. */
export function hasCustomerFilters(filters: CustomerFilterState) {
  return Boolean(
    filters.search ||
    filters.registeredFrom ||
    filters.registeredTo ||
    filters.hasOrders,
  );
}

/** The same inline search and filter bar as the Threads page. */
export function CustomerFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: CustomerFilterState;
  onChange: (filters: CustomerFilterState) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-64 flex-1">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search name, email, phone or customer ID…"
          aria-label="Search customers"
          className={cn("pl-8", filters.search && ACTIVE_FILTER_STYLE)}
        />
      </div>

      <DateRangePicker
        from={filters.registeredFrom}
        to={filters.registeredTo}
        onRangeChange={(registeredFrom, registeredTo) =>
          onChange({ ...filters, registeredFrom, registeredTo })
        }
        disabled={{ after: new Date() }}
      />

      <FilterSelect
        ariaLabel="Filter by orders"
        value={filters.hasOrders}
        activeClassName={ACTIVE_FILTER_STYLE}
        onChange={(hasOrders) =>
          onChange({
            ...filters,
            hasOrders: hasOrders as CustomerFilterState["hasOrders"],
          })
        }
        options={[
          { value: "", label: "All Orders" },
          { value: "true", label: "With Orders" },
          { value: "false", label: "Without Orders" },
        ]}
      />

      <FilterSelect
        ariaLabel="Sort customers"
        value={filters.ordering}
        // Always has a value, so highlighted only once moved off the default.
        activeClassName={
          filters.ordering !== DEFAULT_CUSTOMER_FILTERS.ordering
            ? ACTIVE_FILTER_STYLE
            : undefined
        }
        onChange={(ordering) =>
          onChange({ ...filters, ordering: ordering as CustomerOrdering })
        }
        options={SORT_OPTIONS}
      />

      {hasCustomerFilters(filters) && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={onClear}
        >
          <IconX />
          Clear
        </Button>
      )}
    </div>
  );
}
