"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Typography } from "@/components/ui/typography";
import { IconFilter } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";

export type PostFilters = {
  /** Indices into RANGE_STOPS, not raw counts. */
  likes: [number, number];
  comments: [number, number];
  from: string;
  to: string;
};

/**
 * A fixed, non-linear scale rather than bounds derived from the loaded
 * rows: filtering is resolved server-side, so the client only ever sees one
 * page and can't know the real ceiling. The stops are dense where posts
 * actually cluster and coarse at the top, so the handle stays usable across
 * six orders of magnitude.
 */
export const RANGE_STOPS = [
  0, 10, 25, 50, 100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000,
  100_000, 250_000, 500_000, 1_000_000,
];

const MAX_STOP_INDEX = RANGE_STOPS.length - 1;

/** The top stop means "and above", so it never caps the query. */
export function stopValue(index: number): number | undefined {
  return index >= MAX_STOP_INDEX ? undefined : RANGE_STOPS[index];
}

function formatStop(index: number) {
  const value = RANGE_STOPS[Math.min(index, MAX_STOP_INDEX)];
  return index >= MAX_STOP_INDEX
    ? `${value.toLocaleString()}+`
    : value.toLocaleString();
}

export function defaultPostFilters(): PostFilters {
  return {
    likes: [0, MAX_STOP_INDEX],
    comments: [0, MAX_STOP_INDEX],
    from: "",
    to: "",
  };
}

/** How many filters are narrowing the list — drives the trigger's badge. */
export function countActivePostFilters(filters: PostFilters) {
  let active = 0;
  if (filters.likes[0] > 0 || filters.likes[1] < MAX_STOP_INDEX) active += 1;
  if (filters.comments[0] > 0 || filters.comments[1] < MAX_STOP_INDEX) {
    active += 1;
  }
  if (filters.from || filters.to) active += 1;
  return active;
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="muted" className="font-medium">
        {label}
      </Typography>
      <div className="flex items-center justify-between">
        <Typography variant="small" as="span">
          {formatStop(value[0])}
        </Typography>
        <Typography variant="small" as="span">
          {formatStop(value[1])}
        </Typography>
      </div>
      <Slider
        min={0}
        max={MAX_STOP_INDEX}
        step={1}
        value={value}
        onValueChange={(next) =>
          onChange([next[0], next[1]] as [number, number])
        }
      />
    </div>
  );
}

/**
 * Filter popover for the posts list: engagement ranges and a date range.
 * Every value here is sent to the API — nothing is filtered client-side.
 */
export function PostFiltersPopover({
  filters,
  onChange,
  onClear,
  matchCount,
  totalCount,
  isFiltered,
}: {
  filters: PostFilters;
  onChange: (filters: PostFilters) => void;
  onClear: () => void;
  matchCount: number;
  totalCount: number;
  isFiltered: boolean;
}) {
  const activeCount = countActivePostFilters(filters);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="shrink-0">
          <IconFilter className="size-4" />
          Filters
          {activeCount > 0 && <Badge variant="secondary">{activeCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 space-y-3">
        {/* Lives here rather than in the toolbar so the list keeps a single
            row of controls. */}
        <Typography variant="muted">
          {isFiltered
            ? `Showing ${matchCount} of ${totalCount} posts`
            : `${totalCount} ${totalCount === 1 ? "post" : "posts"}`}
        </Typography>
        <Separator />
        <RangeField
          label="Likes"
          value={filters.likes}
          onChange={(likes) => onChange({ ...filters, likes })}
        />
        <Separator />
        <RangeField
          label="Comments"
          value={filters.comments}
          onChange={(comments) => onChange({ ...filters, comments })}
        />
        <Separator />
        <div className="flex flex-col gap-2">
          <Typography variant="muted" className="font-medium">
            Posted between
          </Typography>
          <DateRangePicker
            from={filters.from}
            to={filters.to}
            onRangeChange={(from, to) => onChange({ ...filters, from, to })}
          />
        </div>
        <Separator />
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          disabled={activeCount === 0}
          className="w-full"
        >
          Clear filters
        </Button>
      </PopoverContent>
    </Popover>
  );
}
