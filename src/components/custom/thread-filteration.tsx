"use client";

import { useState } from "react";
import { IconCheck, IconSearch, IconX } from "@tabler/icons-react";

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
import { tint } from "@/components/custom/helpdesk/tag-badge";
import {
  ACTIVE_FILTER_STYLE,
  FEEDBACK_RATINGS,
  type FeedbackRatingValue,
} from "@/lib/config";
import type { ThreadTagOption } from "@/redux/api-slice/thread-slice";
import { cn } from "@/lib/utils";

export type FeedbackRating = "" | FeedbackRatingValue;

export type ThreadFilterState = {
  search: string;
  is_active: "" | "true" | "false";
  user_type: "" | "guest" | "logged_in";
  has_ticket: "" | "true" | "false";
  has_order: "" | "true" | "false";
  has_agent: "" | "true" | "false";
  has_feedback: "" | "true" | "false";
  feedback_rating: FeedbackRating;
  tags: string[];
  handled_by: "" | "ai" | "human";
  channel: "" | "whatsapp" | "web";
  from: string;
  to: string;
};

export const DEFAULT_THREAD_FILTERS: ThreadFilterState = {
  search: "",
  is_active: "",
  user_type: "",
  has_ticket: "",
  has_order: "",
  has_agent: "",
  has_feedback: "",
  feedback_rating: "",
  tags: [],
  handled_by: "",
  channel: "",
  from: "",
  to: "",
};

type ThreadFilterationProps = {
  filters: ThreadFilterState;
  onChange: (filters: ThreadFilterState) => void;
  onClear: () => void;
  tagOptions: ThreadTagOption[];
  isLoadingTagOptions?: boolean;
};

// Radix Select forbids empty-string item values, so "All" uses a sentinel
// that maps back to "" (filter off) in state.
const ALL = "all";

// Shared with the dashboard filters, so both screens offer the same channels.
export const CHANNEL_OPTIONS = [
  { value: "", label: "All Channels" },
  { value: "web", label: "Web" },
  { value: "whatsapp", label: "WhatsApp" },
];

export function FilterSelect({
  ariaLabel,
  value,
  onChange,
  options,
  activeClassName,
}: {
  ariaLabel: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  activeClassName?: string;
}) {
  return (
    <Select
      value={value || ALL}
      onValueChange={(next) => onChange(next === ALL ? "" : next)}
    >
      <SelectTrigger
        size="sm"
        aria-label={ariaLabel}
        className={cn("w-fit", value && activeClassName)}
      >
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

// How many tag chips show before "Show more". A store can have dozens of
// tags; the most used come first, so the rest can wait behind a button.
const VISIBLE_TAG_CHIPS = 8;

// The tags threads carry, each as a chip with its thread count — "Payment (12)".
// Chips toggle: the filter is "any of the selected tags", and none selected
// means no tag filter. Filtering happens server-side; this just builds the
// selection. The chips are counted against the other active filters, so a
// selected tag can drop out of the options (its count would be 0); it stays
// shown, at 0, so it can still be switched off. Only the first few chips show
// until "Show more"; a selected chip is always shown, collapsed or not.
function TagChipFilter({
  options,
  value,
  onChange,
  isLoading,
}: {
  options: ThreadTagOption[];
  value: string[];
  onChange: (value: string[]) => void;
  isLoading?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = (name: string) =>
    value.some((item) => item.toLowerCase() === name.toLowerCase());

  const missing = value.filter(
    (item) =>
      !options.some((tag) => tag.name.toLowerCase() === item.toLowerCase()),
  );
  const chips = [
    ...options,
    ...missing.map((name) => ({
      id: -1,
      name,
      color: "",
      description: "",
      count: 0,
    })),
  ];

  if (chips.length === 0 && !isLoading) return null;

  const shown = expanded
    ? chips
    : chips.filter(
        (tag, index) => index < VISIBLE_TAG_CHIPS || isSelected(tag.name),
      );
  const hiddenCount = chips.length - shown.length;

  const toggle = (name: string) =>
    onChange(
      isSelected(name)
        ? value.filter((item) => item.toLowerCase() !== name.toLowerCase())
        : [...value, name],
    );

  return (
    <div
      role="group"
      aria-label="Filter by tag"
      className="flex flex-wrap items-center gap-2"
    >
      <span className="text-sm text-muted-foreground">Tags</span>
      {chips.length === 0 ? (
        <span className="text-sm text-muted-foreground">Loading…</span>
      ) : null}
      {shown.map((tag) => {
        const selected = isSelected(tag.name);
        return (
          <button
            key={tag.id === -1 ? `missing-${tag.name}` : tag.id}
            type="button"
            aria-pressed={selected}
            title={tag.description || undefined}
            onClick={() => toggle(tag.name)}
            className={cn(
              "inline-flex max-w-full cursor-pointer items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
              !tag.color &&
                (selected
                  ? "border-foreground/40 bg-accent text-accent-foreground"
                  : "text-foreground hover:bg-accent/60"),
            )}
            style={
              tag.color
                ? {
                    color: tag.color,
                    backgroundColor: tint(tag.color, selected ? 0.28 : 0.1),
                    borderColor: selected ? tag.color : tint(tag.color, 0.3),
                  }
                : undefined
            }
          >
            {selected ? <IconCheck className="size-3 shrink-0" /> : null}
            <span className="max-w-40 truncate">{tag.name}</span>
            <span className="shrink-0 tabular-nums opacity-70">
              ({tag.count})
            </span>
          </button>
        );
      })}
      {expanded || hiddenCount > 0 ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-1 py-0 text-xs"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? "Show less" : `Show more (${hiddenCount})`}
        </Button>
      ) : null}
    </div>
  );
}

export default function ThreadFilteration({
  filters,
  onChange,
  onClear,
  tagOptions,
  isLoadingTagOptions,
}: ThreadFilterationProps) {
  const hasActiveFilters =
    filters.search !== "" ||
    filters.is_active !== "" ||
    filters.user_type !== "" ||
    filters.has_ticket !== "" ||
    filters.has_order !== "" ||
    filters.has_agent !== "" ||
    filters.has_feedback !== "" ||
    filters.feedback_rating !== "" ||
    filters.tags.length > 0 ||
    filters.handled_by !== "" ||
    filters.channel !== "" ||
    filters.from !== "" ||
    filters.to !== "";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-64 flex-1">
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
          className={
            filters.from || filters.to ? ACTIVE_FILTER_STYLE : undefined
          }
        />

        <FilterSelect
          ariaLabel="Filter by support ticket"
          value={filters.has_ticket}
          activeClassName={ACTIVE_FILTER_STYLE}
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

        <FilterSelect
          ariaLabel="Filter by order"
          value={filters.has_order}
          activeClassName={ACTIVE_FILTER_STYLE}
          onChange={(has_order) =>
            onChange({
              ...filters,
              has_order: has_order as ThreadFilterState["has_order"],
            })
          }
          options={[
            { value: "", label: "All Orders" },
            { value: "true", label: "With Order" },
            { value: "false", label: "Without Order" },
          ]}
        />

        <FilterSelect
          ariaLabel="Filter by handled by"
          value={filters.handled_by}
          activeClassName={ACTIVE_FILTER_STYLE}
          onChange={(handled_by) =>
            onChange({
              ...filters,
              handled_by: handled_by as ThreadFilterState["handled_by"],
            })
          }
          options={[
            { value: "", label: "All Handlers" },
            { value: "ai", label: "AI" },
            { value: "human", label: "Agent" },
          ]}
        />

        <FilterSelect
          ariaLabel="Filter by channel"
          value={filters.channel}
          activeClassName={ACTIVE_FILTER_STYLE}
          onChange={(channel) =>
            onChange({
              ...filters,
              channel: channel as ThreadFilterState["channel"],
            })
          }
          options={CHANNEL_OPTIONS}
        />

        {filters.has_feedback === "true" && (
          <FilterSelect
            ariaLabel="Filter by feedback rating"
            value={filters.feedback_rating}
            activeClassName={ACTIVE_FILTER_STYLE}
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

      <TagChipFilter
        options={tagOptions}
        value={filters.tags}
        onChange={(tags) => onChange({ ...filters, tags })}
        isLoading={isLoadingTagOptions}
      />
    </div>
  );
}
