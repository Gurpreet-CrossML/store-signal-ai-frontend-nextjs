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
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  ACTIVE_FILTER_STYLE,
  FEEDBACK_RATINGS,
  type FeedbackRatingValue,
} from "@/lib/config";
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
  tagOptions: string[];
  isLoadingTagOptions?: boolean;
};

// Radix Select forbids empty-string item values, so "All" uses a sentinel
// that maps back to "" (filter off) in state.
const ALL = "all";
const ALL_TAGS = "__all_tags__";

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

// Multi-select combobox for an "any of the selected values" filter. Filtering
// happens server-side; this just lets the user build the selection. Options
// are plain strings (the filter value); `labelFor` maps a value to its
// display text when that differs (e.g. workflow slugs -> readable labels).
function MultiSelectFilter({
  options,
  value,
  onChange,
  labelFor = (option) => option,
  placeholder,
  emptyText,
  isLoading,
  activeClassName,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  labelFor?: (option: string) => string;
  placeholder: string;
  emptyText: string;
  isLoading?: boolean;
  activeClassName?: string;
}) {
  const anchor = useComboboxAnchor();
  // An empty selection means "no tag filter", shown as a checked "All Tags"
  // entry. Picking it clears the tags; picking a tag unchecks it.
  const allChecked = value.length === 0;

  return (
    <Combobox
      multiple
      autoHighlight
      items={options.length ? [ALL_TAGS, ...options] : []}
      value={allChecked ? [ALL_TAGS] : value}
      onValueChange={(next: string[]) => {
        if (next.includes(ALL_TAGS) && !allChecked) return onChange([]);
        onChange(next.filter((item) => item !== ALL_TAGS));
      }}
    >
      <ComboboxChips
        ref={anchor}
        className={cn("w-56", value.length > 0 && activeClassName)}
      >
        <ComboboxValue>
          {(selected) => (
            <>
              {(selected as string[])
                .filter((item) => item !== ALL_TAGS)
                .map((item) => (
                  <ComboboxChip key={item}>{labelFor(item)}</ComboboxChip>
                ))}
              <ComboboxChipsInput
                placeholder={
                  value.length ? "" : isLoading ? "Loading…" : placeholder
                }
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{isLoading ? "Loading…" : emptyText}</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item} value={item}>
              {item === ALL_TAGS ? "All Tags" : labelFor(item)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
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
        className={filters.from || filters.to ? ACTIVE_FILTER_STYLE : undefined}
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

      <MultiSelectFilter
        options={tagOptions}
        value={filters.tags}
        activeClassName={ACTIVE_FILTER_STYLE}
        onChange={(tags) => onChange({ ...filters, tags })}
        placeholder="All Tags"
        emptyText="No tags found."
        isLoading={isLoadingTagOptions}
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
  );
}
