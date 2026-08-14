"use client";

import { IconFilter } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
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

/**
 * The list screen's filter state.
 *
 * Booleans are tri-state on purpose: "opted in", "not opted in" and "don't
 * care" are three different questions, and a plain checkbox can only ask
 * two of them.
 */
export type CustomerFilterSelection = {
  emailConsent: "any" | "yes" | "no";
  smsConsent: "any" | "yes" | "no";
  emailVerified: "any" | "yes" | "no";
  ordersMin: string;
  ordersMax: string;
  spentMin: string;
  spentMax: string;
  registeredFrom: string;
  registeredTo: string;
};

export const EMPTY_CUSTOMER_FILTERS: CustomerFilterSelection = {
  emailConsent: "any",
  smsConsent: "any",
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
    Number(filters.emailConsent !== "any") +
    Number(filters.smsConsent !== "any") +
    Number(filters.emailVerified !== "any") +
    Number(Boolean(filters.ordersMin || filters.ordersMax)) +
    Number(Boolean(filters.spentMin || filters.spentMax)) +
    Number(Boolean(filters.registeredFrom || filters.registeredTo))
  );
}

/**
 * Every group is built the same way — one heading treatment, one gap — so
 * the sections read as siblings. Previously "Permissions" was a heading and
 * the three below it were field labels, which made one popover look like
 * two different forms stacked.
 */
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

function TriStateRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: "any" | "yes" | "no";
  onChange: (value: "any" | "yes" | "no") => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <Typography variant="small" as="p" className="font-normal">
          {label}
        </Typography>
        <Typography variant="muted">{description}</Typography>
      </div>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-28 shrink-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any</SelectItem>
          <SelectItem value="yes">Yes</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
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
        inputMode="numeric"
        value={min}
        placeholder="Min"
        aria-label={`${label} minimum`}
        onChange={(event) => onChange({ min: event.target.value, max })}
      />
      <span className="shrink-0 text-muted-foreground">–</span>
      <Input
        type="number"
        min={0}
        inputMode="numeric"
        value={max}
        placeholder="Max"
        aria-label={`${label} maximum`}
        onChange={(event) => onChange({ min, max: event.target.value })}
      />
    </div>
  );
}

export function CustomerFilterPopover({
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
  filters: CustomerFilterSelection;
  onFiltersChange: (filters: CustomerFilterSelection) => void;
  onApply: () => void;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Filter customers">
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
          <CardTitle>Filter customers</CardTitle>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-4">
          <FilterGroup title="Permissions">
            <TriStateRow
              label="Email marketing"
              description="Opted in to email campaigns."
              value={filters.emailConsent}
              onChange={(emailConsent) =>
                onFiltersChange({ ...filters, emailConsent })
              }
            />
            <TriStateRow
              label="SMS marketing"
              description="Opted in to SMS and WhatsApp."
              value={filters.smsConsent}
              onChange={(smsConsent) =>
                onFiltersChange({ ...filters, smsConsent })
              }
            />
            <TriStateRow
              label="Email verified"
              description="Address confirmed by the platform."
              value={filters.emailVerified}
              onChange={(emailVerified) =>
                onFiltersChange({ ...filters, emailVerified })
              }
            />
          </FilterGroup>

          <FilterGroup title="Orders">
            <RangeRow
              label="Orders"
              min={filters.ordersMin}
              max={filters.ordersMax}
              onChange={({ min, max }) =>
                onFiltersChange({ ...filters, ordersMin: min, ordersMax: max })
              }
            />
          </FilterGroup>

          <FilterGroup title="Total spent">
            <RangeRow
              label="Total spent"
              min={filters.spentMin}
              max={filters.spentMax}
              onChange={({ min, max }) =>
                onFiltersChange({ ...filters, spentMin: min, spentMax: max })
              }
            />
          </FilterGroup>

          <FilterGroup title="Customer since">
            <DateRangePicker
              from={filters.registeredFrom}
              to={filters.registeredTo}
              disabled={{ after: new Date() }}
              onRangeChange={(registeredFrom, registeredTo) =>
                onFiltersChange({ ...filters, registeredFrom, registeredTo })
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
            Apply filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
