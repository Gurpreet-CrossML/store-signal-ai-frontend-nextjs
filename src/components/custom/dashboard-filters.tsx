"use client";

import { IconRefresh } from "@tabler/icons-react";
import { format, parse, subDays } from "date-fns";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import {
  CHANNEL_OPTIONS,
  FilterSelect,
} from "@/components/custom/thread-filteration";
import {
  ACTIVE_FILTER_STYLE,
  API_DATE_FORMAT,
  DISPLAY_DATE_FORMAT,
} from "@/lib/config";
import { Button } from "@/components/ui/button";

export type DashboardFilterState = {
  range: "today" | "7d" | "30d" | "custom";
  // Only read for the custom range; presets resolve against today on every load.
  from: string;
  to: string;
  channel: "" | "web" | "whatsapp";
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  range: "7d",
  from: "",
  to: "",
  channel: "",
};

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

// Days back from today — the same window the APIs default to for 30 days.
const PRESET_DAYS = { today: 0, "7d": 7, "30d": 30 };

const toISODate = (date: Date) => format(date, API_DATE_FORMAT);
const fromISODate = (value: string) =>
  parse(value, API_DATE_FORMAT, new Date());

/** The from/to (YYYY-MM-DD) every dashboard API is called with. */
export function resolveDashboardRange(filters: DashboardFilterState) {
  if (filters.range === "custom") {
    return { from: filters.from, to: filters.to };
  }
  const today = new Date();
  return {
    from: toISODate(subDays(today, PRESET_DAYS[filters.range])),
    to: toISODate(today),
  };
}

/** The selected period in words, e.g. "Last 7 days" or "Oct 01, 2026 – Oct 10, 2026". */
export function dashboardRangeLabel(filters: DashboardFilterState) {
  if (filters.range === "custom") {
    return `${format(fromISODate(filters.from), DISPLAY_DATE_FORMAT)} – ${format(fromISODate(filters.to), DISPLAY_DATE_FORMAT)}`;
  }
  return RANGE_OPTIONS.find((option) => option.value === filters.range)!.label;
}

/** The date range select, plus the picker when the range is custom. */
export function DashboardRangeFilter({
  filters,
  onChange,
  numberOfMonths,
}: {
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
  /** Months the custom picker shows side by side; one fits a narrow screen. */
  numberOfMonths?: 1 | 2;
}) {
  return (
    <>
      <FilterSelect
        ariaLabel="Filter by date range"
        value={filters.range}
        onChange={(range) =>
          onChange({
            ...filters,
            // Custom opens on the period already on screen, not an empty picker.
            ...(range === "custom" ? resolveDashboardRange(filters) : {}),
            range: range as DashboardFilterState["range"],
          })
        }
        options={RANGE_OPTIONS}
        // A period is always applied, including the default.
        activeClassName={ACTIVE_FILTER_STYLE}
      />
      {filters.range === "custom" && (
        <DateRangePicker
          from={filters.from}
          to={filters.to}
          onRangeChange={(from, to) => onChange({ ...filters, from, to })}
          disabled={{ after: new Date() }}
          numberOfMonths={numberOfMonths}
        />
      )}
    </>
  );
}

/** Date and channel filters for the whole dashboard, with refresh status. */
export function DashboardFilters({
  filters,
  onChange,
  lastUpdated,
  refreshing,
  onRefresh,
}: {
  filters: DashboardFilterState;
  onChange: (filters: DashboardFilterState) => void;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <DashboardRangeFilter filters={filters} onChange={onChange} />
      <FilterSelect
        ariaLabel="Filter by channel"
        value={filters.channel}
        onChange={(channel) =>
          onChange({
            ...filters,
            channel: channel as DashboardFilterState["channel"],
          })
        }
        options={CHANNEL_OPTIONS}
        activeClassName={ACTIVE_FILTER_STYLE}
      />
      {(filters.range !== DEFAULT_DASHBOARD_FILTERS.range ||
        filters.channel !== DEFAULT_DASHBOARD_FILTERS.channel) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(DEFAULT_DASHBOARD_FILTERS)}
        >
          Clear Filters
        </Button>
      )}
      <span className="text-xs text-muted-foreground">
        {lastUpdated && `Updated ${format(lastUpdated, "h:mm:ss a")} · `}
        {filters.range === "custom" ? "auto-refresh off" : "auto-refresh on"}
      </span>
      <Button
        variant="outline"
        size="icon-sm"
        aria-label="Refresh dashboard"
        onClick={onRefresh}
        disabled={refreshing}
      >
        <IconRefresh className={refreshing ? "animate-spin" : undefined} />
      </Button>
    </div>
  );
}
