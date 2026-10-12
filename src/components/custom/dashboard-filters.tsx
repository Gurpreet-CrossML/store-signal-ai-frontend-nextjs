"use client";

import { IconRefresh } from "@tabler/icons-react";
import { format, parseISO, subDays } from "date-fns";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import {
  CHANNEL_OPTIONS,
  FilterSelect,
} from "@/components/custom/thread-filteration";
import { Button } from "@/components/ui/button";

export type DashboardFilterState = {
  range: "today" | "7d" | "30d" | "custom";
  // Only read for the custom range. Presets resolve against today on every
  // load, so a remembered "Last 7 days" still means the last 7 days tomorrow.
  from: string;
  to: string;
  channel: "" | "web" | "whatsapp";
};

export const DEFAULT_DASHBOARD_FILTERS: DashboardFilterState = {
  range: "30d",
  from: "",
  to: "",
  channel: "",
};

const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

// Days back from today — the same window the APIs default to for 30 days.
const PRESET_DAYS = { today: 0, "7d": 7, "30d": 30 };

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const toISODate = (date: Date) => format(date, "yyyy-MM-dd");

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
    return `${format(parseISO(filters.from), "MMM dd, yyyy")} – ${format(parseISO(filters.to), "MMM dd, yyyy")}`;
  }
  return RANGE_OPTIONS.find((option) => option.value === filters.range)!.label;
}

/** Per-user storage key; the company prefix keeps one email in two companies apart. */
export function dashboardFiltersKey(user?: {
  email?: string | null;
  company_code?: string | null;
}) {
  return user?.email
    ? `dashboardFilters:${user.company_code ?? ""}:${user.email}`
    : null;
}

/** The filters this user last applied, or the defaults. */
export function loadDashboardFilters(
  storageKey: string | null,
): DashboardFilterState {
  try {
    const stored = storageKey
      ? JSON.parse(localStorage.getItem(storageKey) ?? "null")
      : null;
    const isCustom = stored?.range === "custom";
    if (
      RANGE_OPTIONS.some((option) => option.value === stored?.range) &&
      CHANNEL_OPTIONS.some((option) => option.value === stored?.channel) &&
      (!isCustom ||
        (DATE_ONLY_RE.test(stored.from) && DATE_ONLY_RE.test(stored.to)))
    ) {
      return {
        range: stored.range,
        from: isCustom ? stored.from : "",
        to: isCustom ? stored.to : "",
        channel: stored.channel,
      };
    }
  } catch {
    // Corrupt value or blocked storage (private mode): use the defaults.
  }
  return DEFAULT_DASHBOARD_FILTERS;
}

export function saveDashboardFilters(
  storageKey: string | null,
  filters: DashboardFilterState,
) {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(filters));
  } catch {
    // Blocked storage: the filters still apply, they just aren't remembered.
  }
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
      />
      {filters.range === "custom" && (
        <DateRangePicker
          from={filters.from}
          to={filters.to}
          onRangeChange={(from, to) => onChange({ ...filters, from, to })}
          disabled={{ after: new Date() }}
        />
      )}
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
      />
      <span className="text-xs text-muted-foreground">
        {lastUpdated
          ? `Updated ${format(lastUpdated, "h:mm:ss a")} · auto-refresh on`
          : "Auto-refresh on"}
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
