"use client";

import { IconSearch, IconX } from "@tabler/icons-react";

import { DateRangePicker } from "@/components/custom/date-range-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FEEDBACK_RATINGS, type FeedbackRatingValue } from "@/lib/config";

export type FeedbackRating = "" | FeedbackRatingValue;

export type ThreadFilterState = {
  search: string;
  is_active: "" | "true" | "false";
  user_type: "" | "guest" | "logged_in";
  has_ticket: "" | "true" | "false";
  has_feedback: "" | "true" | "false";
  feedback_rating: FeedbackRating;
  from: string;
  to: string;
};

export const DEFAULT_THREAD_FILTERS: ThreadFilterState = {
  search: "",
  is_active: "",
  user_type: "",
  has_ticket: "",
  has_feedback: "",
  feedback_rating: "",
  from: "",
  to: "",
};

type ThreadFilterationProps = {
  filters: ThreadFilterState;
  onChange: (filters: ThreadFilterState) => void;
  onClear: () => void;
};

// Radix Select forbids empty-string item values, so "All" uses a sentinel
// that maps back to "" (filter off) in state.
const ALL = "all";

function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger size="sm" aria-label={ariaLabel} className="w-fit">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value || ALL} value={option.value || ALL}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function ThreadFilteration({
  filters,
  onChange,
  onClear,
}: ThreadFilterationProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.is_active !== "" ||
    filters.user_type !== "" ||
    filters.has_ticket !== "" ||
    filters.has_feedback !== "" ||
    filters.feedback_rating !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search name, email, messages…"
          className="pl-8"
        />
      </div>

      <DateRangePicker
        from={filters.from}
        to={filters.to}
        onRangeChange={(from, to) => onChange({ ...filters, from, to })}
        disabled={{ after: new Date() }}
        withTime
      />

      <FilterSelect
        ariaLabel="Filter by status"
        value={filters.is_active}
        onChange={(is_active) =>
          onChange({
            ...filters,
            is_active: is_active as ThreadFilterState["is_active"],
          })
        }
        options={[
          { value: "", label: "All Statuses" },
          { value: "true", label: "Active" },
          { value: "false", label: "Closed" },
        ]}
      />

      <FilterSelect
        ariaLabel="Filter by support ticket"
        value={filters.has_ticket}
        onChange={(has_ticket) =>
          onChange({
            ...filters,
            has_ticket: has_ticket as ThreadFilterState["has_ticket"],
          })
        }
        options={[
          { value: "", label: "All Tickets" },
          { value: "true", label: "With Ticket" },
          { value: "false", label: "Without Ticket" },
        ]}
      />

      {filters.has_feedback === "true" && (
        <FilterSelect
          ariaLabel="Filter by feedback rating"
          value={filters.feedback_rating}
          onChange={(feedback_rating) =>
            onChange({
              ...filters,
              feedback_rating: feedback_rating as FeedbackRating,
            })
          }
          options={[
            { value: "", label: "All Ratings" },
            ...FEEDBACK_RATINGS.map((rating) => ({
              value: rating.value,
              label: rating.label,
            })),
          ]}
        />
      )}

      {hasActiveFilters && (
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
