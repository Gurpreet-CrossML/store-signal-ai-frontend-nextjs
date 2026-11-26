"use client";

import { IconX } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { FilterSelect } from "@/components/custom/thread-filteration";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Shopify's own `financial_status` values. Matches the set StatusBadge
 * already knows how to colour, so a filter chip and the badge it selects
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
 * Statuses as toggling chips rather than a multi-select: there are only a
 * handful, they all fit, and seeing which are on takes no interaction.
 */
function StatusChips({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onToggle(option.value)}
          >
            <Badge
              variant="outline"
              className={cn(
                "cursor-pointer",
                isOn && "border-primary/20 bg-primary/10 text-primary",
              )}
            >
              {option.label}
            </Badge>
          </button>
        );
      })}
    </div>
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
        className={cn("w-36", min && ACTIVE_FILTER_STYLE)}
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
        className={cn("w-36", max && ACTIVE_FILTER_STYLE)}
        aria-label={`${label} maximum`}
        onChange={(event) => onChange({ min, max: event.target.value })}
      />
    </div>
  );
}

/**
 * The same inline filters as the Threads page: selects in the search row,
 * chips beneath. Renders as a fragment so the controls wrap in the screen's
 * own search row.
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
  const toggle =
    (key: "financialStatuses" | "fulfillmentStatuses") => (value: string) =>
      onChange({
        ...filters,
        [key]: filters[key].includes(value)
          ? filters[key].filter((entry) => entry !== value)
          : [...filters[key], value],
      });

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

      <div className="flex basis-full flex-wrap items-center gap-2">
        <Typography variant="muted" as="span">
          Payment Status
        </Typography>
        <StatusChips
          options={FINANCIAL_STATUSES}
          selected={filters.financialStatuses}
          onToggle={toggle("financialStatuses")}
        />
      </div>

      <div className="flex basis-full flex-wrap items-center gap-2">
        <Typography variant="muted" as="span">
          Delivery Status
        </Typography>
        <StatusChips
          options={FULFILLMENT_STATUSES}
          selected={filters.fulfillmentStatuses}
          onToggle={toggle("fulfillmentStatuses")}
        />
      </div>
    </>
  );
}
