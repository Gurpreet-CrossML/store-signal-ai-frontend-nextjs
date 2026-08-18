"use client";

import { IconFilter } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
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
  { value: "partially_paid", label: "Partially paid" },
  { value: "partially_refunded", label: "Partially refunded" },
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
  { value: "partial", label: "Partially fulfilled" },
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
    Number(filters.financialStatuses.length > 0) +
    Number(filters.fulfillmentStatuses.length > 0) +
    Number(Boolean(filters.totalMin || filters.totalMax)) +
    Number(Boolean(filters.createdFrom || filters.createdTo)) +
    Number(filters.money !== "any") +
    Number(filters.cancelled !== "any")
  );
}

/** Same group anatomy as the customer filters, so the two popovers match. */
function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3">
        <Typography variant="small" as="span">
          {title}
        </Typography>
      </legend>
      {children}
    </fieldset>
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
        placeholder="Min"
        aria-label={`${label} minimum`}
        onChange={(event) => onChange({ min: event.target.value, max })}
      />
      <span className="shrink-0 text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        inputMode="decimal"
        value={max}
        placeholder="Max"
        aria-label={`${label} maximum`}
        onChange={(event) => onChange({ min, max: event.target.value })}
      />
    </div>
  );
}

export function OrderFilterPopover({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClear,
  activeCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: OrderFilterSelection;
  onFiltersChange: (filters: OrderFilterSelection) => void;
  onApply: () => void;
  onClear: () => void;
  activeCount: number;
}) {
  const toggle =
    (key: "financialStatuses" | "fulfillmentStatuses") => (value: string) =>
      onFiltersChange({
        ...filters,
        [key]: filters[key].includes(value)
          ? filters[key].filter((entry) => entry !== value)
          : [...filters[key], value],
      });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Filter Orders">
          <IconFilter className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="flex size-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-90 p-0">
        <div className="border-b px-4 py-3">
          <CardTitle>Filter Orders</CardTitle>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-4">
          <FilterGroup title="Payment Status">
            <StatusChips
              options={FINANCIAL_STATUSES}
              selected={filters.financialStatuses}
              onToggle={toggle("financialStatuses")}
            />
          </FilterGroup>

          <FilterGroup title="Delivery Status">
            <StatusChips
              options={FULFILLMENT_STATUSES}
              selected={filters.fulfillmentStatuses}
              onToggle={toggle("fulfillmentStatuses")}
            />
          </FilterGroup>

          <FilterGroup title="Money">
            <Select
              value={filters.money}
              onValueChange={(money) =>
                onFiltersChange({
                  ...filters,
                  money: money as OrderFilterSelection["money"],
                })
              }
            >
              <SelectTrigger aria-label="Outstanding or refunded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="outstanding">Has amount owing</SelectItem>
                <SelectItem value="refunded">Has a refund</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>

          <FilterGroup title="Cancelled">
            <Select
              value={filters.cancelled}
              onValueChange={(cancelled) =>
                onFiltersChange({
                  ...filters,
                  cancelled: cancelled as OrderFilterSelection["cancelled"],
                })
              }
            >
              <SelectTrigger aria-label="Cancelled orders">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="no">Hide cancelled</SelectItem>
                <SelectItem value="yes">Only cancelled</SelectItem>
              </SelectContent>
            </Select>
          </FilterGroup>

          <FilterGroup title="Order Total">
            <RangeRow
              label="Order Total"
              min={filters.totalMin}
              max={filters.totalMax}
              onChange={({ min, max }) =>
                onFiltersChange({ ...filters, totalMin: min, totalMax: max })
              }
            />
          </FilterGroup>

          <FilterGroup title="Placed">
            <DateRangePicker
              from={filters.createdFrom}
              to={filters.createdTo}
              disabled={{ after: new Date() }}
              onRangeChange={(createdFrom, createdTo) =>
                onFiltersChange({ ...filters, createdFrom, createdTo })
              }
            />
          </FilterGroup>
        </div>

        <div className="flex items-center justify-between border-t p-3">
          {activeCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={onApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
