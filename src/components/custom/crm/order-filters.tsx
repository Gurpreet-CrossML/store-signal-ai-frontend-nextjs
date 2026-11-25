"use client";

import { IconSearch, IconX } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { FilterSelect } from "@/components/custom/thread-filteration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import type { OrderOrdering } from "@/redux/api-slice/order-slice";

/**
 * Shopify's own `financial_status` values. Matches the set StatusBadge
 * already knows how to colour, so a filter and the badge it selects for
 * can't disagree.
 */
const FINANCIAL_STATUSES = [
  { value: "", label: "All Payments" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "voided", label: "Voided" },
  { value: "unpaid", label: "Unpaid" },
];

/**
 * "unfulfilled" is ours, not the platform's: Shopify models "nothing has
 * shipped" as a null rather than a string, and a filter cannot send null.
 */
const FULFILLMENT_STATUSES = [
  { value: "", label: "All Fulfillments" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "partial", label: "Partially Fulfilled" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "restocked", label: "Restocked" },
];

const SORT_OPTIONS: { value: OrderOrdering; label: string }[] = [
  { value: "-created_at", label: "Newest First" },
  { value: "created_at", label: "Oldest First" },
  { value: "-total_price", label: "Highest Value" },
  { value: "total_price", label: "Lowest Value" },
  { value: "-order_number", label: "Order Number" },
];

/** The list screen's filters; "" means the filter is off. */
export type OrderFilterState = {
  search: string;
  createdFrom: string;
  createdTo: string;
  financialStatus: string;
  fulfillmentStatus: string;
  cancelled: "" | "true" | "false";
  ordering: OrderOrdering;
};

export const DEFAULT_ORDER_FILTERS: OrderFilterState = {
  search: "",
  createdFrom: "",
  createdTo: "",
  financialStatus: "",
  fulfillmentStatus: "",
  cancelled: "",
  ordering: "-created_at",
};

/** True when anything narrows the list; the sort order doesn't. */
export function hasOrderFilters(filters: OrderFilterState) {
  return Boolean(
    filters.search ||
    filters.createdFrom ||
    filters.createdTo ||
    filters.financialStatus ||
    filters.fulfillmentStatus ||
    filters.cancelled,
  );
}

/** The same inline search and filter bar as the Threads page. */
export function OrderFilterBar({
  filters,
  onChange,
  onClear,
}: {
  filters: OrderFilterState;
  onChange: (filters: OrderFilterState) => void;
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
          placeholder="Search order number, email, phone or tracking…"
          aria-label="Search orders"
          className="pl-8"
        />
      </div>

      <DateRangePicker
        from={filters.createdFrom}
        to={filters.createdTo}
        onRangeChange={(createdFrom, createdTo) =>
          onChange({ ...filters, createdFrom, createdTo })
        }
        disabled={{ after: new Date() }}
      />

      <FilterSelect
        ariaLabel="Filter by payment status"
        value={filters.financialStatus}
        activeClassName={ACTIVE_FILTER_STYLE}
        onChange={(financialStatus) =>
          onChange({ ...filters, financialStatus })
        }
        options={FINANCIAL_STATUSES}
      />

      <FilterSelect
        ariaLabel="Filter by fulfillment status"
        value={filters.fulfillmentStatus}
        activeClassName={ACTIVE_FILTER_STYLE}
        onChange={(fulfillmentStatus) =>
          onChange({ ...filters, fulfillmentStatus })
        }
        options={FULFILLMENT_STATUSES}
      />

      <FilterSelect
        ariaLabel="Filter by cancelled"
        value={filters.cancelled}
        activeClassName={ACTIVE_FILTER_STYLE}
        onChange={(cancelled) =>
          onChange({
            ...filters,
            cancelled: cancelled as OrderFilterState["cancelled"],
          })
        }
        options={[
          { value: "", label: "Include Cancelled" },
          { value: "false", label: "Hide Cancelled" },
          { value: "true", label: "Only Cancelled" },
        ]}
      />

      <FilterSelect
        ariaLabel="Sort orders"
        value={filters.ordering}
        onChange={(ordering) =>
          onChange({ ...filters, ordering: ordering as OrderOrdering })
        }
        options={SORT_OPTIONS}
      />

      {hasOrderFilters(filters) && (
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
