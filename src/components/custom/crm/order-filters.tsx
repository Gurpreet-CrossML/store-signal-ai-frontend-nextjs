"use client";

import { IconX } from "@tabler/icons-react";

import { CheckboxMultiSelect } from "@/components/custom/checkbox-multi-select";
import { DateRangePicker } from "@/components/custom/date-range-picker";
import { FilterSelect } from "@/components/custom/thread-filteration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Shopify's own `financial_status` values. Matches the set StatusBadge
 * already knows how to colour, so a filter option and the badge it selects
 * for can't disagree.
 */
export const FINANCIAL_STATUSES = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "authorized", label: "Authorized" },
  { value: "partially_paid", label: "Partially Paid" },
  { value: "partially_refunded", label: "Partially Refunded" },
  { value: "refunded", label: "Refunded" },
  { value: "voided", label: "Voided" },
  { value: "unpaid", label: "Unpaid" },
] as const;

/**
 * "unfulfilled" is ours, not the platform's: Shopify models "nothing has
 * shipped" as a null rather than a string, and a filter cannot send null.
 */
export const FULFILLMENT_STATUSES = [
  { value: "fulfilled", label: "Fulfilled" },
  { value: "partial", label: "Partially Fulfilled" },
  { value: "unfulfilled", label: "Unfulfilled" },
  { value: "restocked", label: "Restocked" },
] as const;

export type OrderFilterSelection = {
  financialStatuses: string[];
  fulfillmentStatuses: string[];
  totalMin: string;
  totalMax: string;
  createdFrom: string;
  createdTo: string;
  money: "any" | "outstanding" | "refunded";
  cancelled: "any" | "yes" | "no";
};

export const EMPTY_ORDER_FILTERS: OrderFilterSelection = {
  financialStatuses: [],
  fulfillmentStatuses: [],
  totalMin: "",
  totalMax: "",
  createdFrom: "",
  createdTo: "",
  money: "any",
  cancelled: "any",
};

export function countActiveOrderFilters(filters: OrderFilterSelection) {
  return (
    filters.financialStatuses.length +
    filters.fulfillmentStatuses.length +
    Number(Boolean(filters.totalMin || filters.totalMax)) +
    Number(Boolean(filters.createdFrom || filters.createdTo)) +
    Number(filters.money !== "any") +
    Number(filters.cancelled !== "any")
  );
}

/**
 * A status filter as a checkbox dropdown sized for the search row. Any
 * number of statuses can be on at once; none on means no filter.
 */
function StatusMultiSelect({
  placeholder,
  options,
  selected,
  onChange,
}: {
  placeholder: string;
  options: readonly { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <CheckboxMultiSelect
      size="sm"
      searchable={false}
      ariaLabel={`Filter by ${placeholder.toLowerCase()}`}
      placeholder={placeholder}
      emptyMessage="No statuses."
      options={options}
      value={selected}
      onChange={onChange}
      className={cn(
        "w-fit max-w-60",
        selected.length > 0 && ACTIVE_FILTER_STYLE,
      )}
    />
  );
}

function RangeRow({
  label,
  min,
  max,
  onChange,
}: {
  label: string;
  min: string;
  max: string;
  onChange: (next: { min: string; max: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        min={0}
        inputMode="decimal"
        value={min}
        placeholder={`Min ${label.toLowerCase()}`}
        className={cn("h-8 w-36", min && ACTIVE_FILTER_STYLE)}
        aria-label={`${label} minimum`}
        onChange={(event) => onChange({ min: event.target.value, max })}
      />
      <span className="shrink-0 text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        inputMode="decimal"
        value={max}
        placeholder={`Max ${label.toLowerCase()}`}
        className={cn("h-8 w-36", max && ACTIVE_FILTER_STYLE)}
        aria-label={`${label} maximum`}
        onChange={(event) => onChange({ min, max: event.target.value })}
      />
    </div>
  );
}

/**
 * The same inline filters as the Threads page. Renders as a fragment so the
 * controls wrap in the screen's own search row.
 */
export function OrderFilterBar({
  filters,
  onChange,
  onClear,
  activeCount,
}: {
  filters: OrderFilterSelection;
  onChange: (filters: OrderFilterSelection) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <>
      <DateRangePicker
        from={filters.createdFrom}
        to={filters.createdTo}
        disabled={{ after: new Date() }}
        onRangeChange={(createdFrom, createdTo) =>
          onChange({ ...filters, createdFrom, createdTo })
        }
      />

      <StatusMultiSelect
        placeholder="Payment Status"
        options={FINANCIAL_STATUSES}
        selected={filters.financialStatuses}
        onChange={(financialStatuses) =>
          onChange({ ...filters, financialStatuses })
        }
      />

      <StatusMultiSelect
        placeholder="Delivery Status"
        options={FULFILLMENT_STATUSES}
        selected={filters.fulfillmentStatuses}
        onChange={(fulfillmentStatuses) =>
          onChange({ ...filters, fulfillmentStatuses })
        }
      />

      <FilterSelect
        ariaLabel="Outstanding or refunded"
        value={filters.money}
        activeClassName={
          filters.money !== "any" ? ACTIVE_FILTER_STYLE : undefined
        }
        onChange={(money) =>
          onChange({
            ...filters,
            money: money as OrderFilterSelection["money"],
          })
        }
        options={[
          { value: "any", label: "All Payments" },
          { value: "outstanding", label: "Has Amount Owing" },
          { value: "refunded", label: "Has A Refund" },
        ]}
      />

      <FilterSelect
        ariaLabel="Cancelled orders"
        value={filters.cancelled}
        activeClassName={
          filters.cancelled !== "any" ? ACTIVE_FILTER_STYLE : undefined
        }
        onChange={(cancelled) =>
          onChange({
            ...filters,
            cancelled: cancelled as OrderFilterSelection["cancelled"],
          })
        }
        options={[
          { value: "any", label: "Include Cancelled" },
          { value: "no", label: "Hide Cancelled" },
          { value: "yes", label: "Only Cancelled" },
        ]}
      />

      <RangeRow
        label="Order Total"
        min={filters.totalMin}
        max={filters.totalMax}
        onChange={({ min, max }) =>
          onChange({ ...filters, totalMin: min, totalMax: max })
        }
      />

      {activeCount > 0 && (
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
    </>
  );
}
