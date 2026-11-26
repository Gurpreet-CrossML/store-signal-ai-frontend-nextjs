"use client";

import { IconX } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { FilterSelect } from "@/components/custom/thread-filteration";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * The list screen's filter state.
 *
 * Booleans are tri-state on purpose: "yes", "no" and "don't care" are three
 * different questions, and a plain checkbox can only ask two of them.
 */
export type CustomerFilterSelection = {
  emailVerified: "any" | "yes" | "no";
  ordersMin: string;
  ordersMax: string;
  spentMin: string;
  spentMax: string;
  registeredFrom: string;
  registeredTo: string;
};

export const EMPTY_CUSTOMER_FILTERS: CustomerFilterSelection = {
  emailVerified: "any",
  ordersMin: "",
  ordersMax: "",
  spentMin: "",
  spentMax: "",
  registeredFrom: "",
  registeredTo: "",
};

export function countActiveCustomerFilters(filters: CustomerFilterSelection) {
  return (
    Number(filters.emailVerified !== "any") +
    Number(Boolean(filters.ordersMin || filters.ordersMax)) +
    Number(Boolean(filters.spentMin || filters.spentMax)) +
    Number(Boolean(filters.registeredFrom || filters.registeredTo))
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
        inputMode="numeric"
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
        inputMode="numeric"
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
 * The same inline filters as the Threads page. Renders as a fragment so the
 * controls wrap in the screen's own search row.
 */
export function CustomerFilterBar({
  filters,
  onChange,
  onClear,
  activeCount,
}: {
  filters: CustomerFilterSelection;
  onChange: (filters: CustomerFilterSelection) => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <>
      <DateRangePicker
        from={filters.registeredFrom}
        to={filters.registeredTo}
        disabled={{ after: new Date() }}
        onRangeChange={(registeredFrom, registeredTo) =>
          onChange({ ...filters, registeredFrom, registeredTo })
        }
      />

      <FilterSelect
        ariaLabel="Filter by email verification"
        value={filters.emailVerified}
        activeClassName={
          filters.emailVerified !== "any" ? ACTIVE_FILTER_STYLE : undefined
        }
        onChange={(emailVerified) =>
          onChange({
            ...filters,
            emailVerified:
              emailVerified as CustomerFilterSelection["emailVerified"],
          })
        }
        options={[
          { value: "any", label: "All Emails" },
          { value: "yes", label: "Verified Email" },
          { value: "no", label: "Unverified Email" },
        ]}
      />

      <RangeRow
        label="Orders"
        min={filters.ordersMin}
        max={filters.ordersMax}
        onChange={({ min, max }) =>
          onChange({ ...filters, ordersMin: min, ordersMax: max })
        }
      />

      <RangeRow
        label="Total Spent"
        min={filters.spentMin}
        max={filters.spentMax}
        onChange={({ min, max }) =>
          onChange({ ...filters, spentMin: min, spentMax: max })
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
