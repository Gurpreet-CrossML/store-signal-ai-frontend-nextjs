"use client";

import { IconFilter } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  AIScope,
  KnowledgeCreator,
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_OPTIONS,
  KNOWLEDGE_STATUS_META,
} from "@/components/custom/knowledge/knowledge-meta";
import { ACTIVE_FILTER_STYLE } from "@/lib/config";
import { cn } from "@/lib/utils";

export type KnowledgeFilterSelection = {
  /** Chosen with the tabs above the list, not in the filter popover. */
  source: KnowledgeSource | "";
  status: KnowledgeStatus[];
  aiScope: AIScope[];
  type: KnowledgeType[];
  /** Ids of the users who added the knowledge. */
  createdBy: string[];
};

export const EMPTY_KNOWLEDGE_FILTERS: KnowledgeFilterSelection = {
  source: "",
  status: [],
  aiScope: [],
  type: [],
  createdBy: [],
};

/** How many options are ticked in the popover, across every section. */
export function countActiveKnowledgeFilters(filters: KnowledgeFilterSelection) {
  return (
    filters.status.length +
    filters.aiScope.length +
    filters.type.length +
    filters.createdBy.length
  );
}

type Option<T extends string> = { value: T; label: string };

const STATUS_OPTIONS: Option<KnowledgeStatus>[] = Object.entries(
  KNOWLEDGE_STATUS_META,
).map(([value, meta]) => ({
  value: value as KnowledgeStatus,
  label: meta.label,
}));

const AI_SCOPE_FILTER_OPTIONS: Option<AIScope>[] = AI_SCOPE_OPTIONS.map(
  ({ value, label }) => ({ value, label }),
);

const APPLIES_TO_OPTIONS: Option<KnowledgeType>[] = [
  { value: "general", label: "Whole store" },
  { value: "product", label: "Specific products" },
];

/** `list` with `value` removed if it is there, added if it is not. */
function toggle<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((entry) => entry !== value)
    : [...list, value];
}

function FilterSection<T extends string>({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: Option<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {title}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, label }) => {
          const isSelected = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(toggle(selected, value))}
              className={cn(
                "rounded-md border px-2.5 py-1 text-sm transition-colors hover:bg-muted",
                isSelected && cn(ACTIVE_FILTER_STYLE, "hover:bg-primary/15"),
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * The "Filter" button and the panel it opens: status, which AI uses the
 * knowledge, what it applies to, and who added it. Every option is a toggle,
 * and an item that matches any ticked option in a section is kept.
 */
export function KnowledgeFilterPopover({
  filters,
  creators,
  onFiltersChange,
}: {
  filters: KnowledgeFilterSelection;
  /** The users who have added knowledge; the "Added by" section is hidden without any. */
  creators: KnowledgeCreator[];
  onFiltersChange: (filters: KnowledgeFilterSelection) => void;
}) {
  const activeCount = countActiveKnowledgeFilters(filters);
  const creatorOptions: Option<string>[] = creators.map(({ id, name }) => ({
    value: String(id),
    label: name,
  }));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "shrink-0 data-[state=open]:border-dashed data-[state=open]:border-primary",
            activeCount > 0 && ACTIVE_FILTER_STYLE,
          )}
        >
          <IconFilter className="size-4" />
          Filter
          {activeCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 gap-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Filter</h3>
          <button
            type="button"
            disabled={activeCount === 0}
            onClick={() =>
              onFiltersChange({
                ...EMPTY_KNOWLEDGE_FILTERS,
                source: filters.source,
              })
            }
            className="text-sm font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Clear all
          </button>
        </div>

        <FilterSection
          title="Status"
          options={STATUS_OPTIONS}
          selected={filters.status}
          onChange={(status) => onFiltersChange({ ...filters, status })}
        />
        <FilterSection
          title="Used by"
          options={AI_SCOPE_FILTER_OPTIONS}
          selected={filters.aiScope}
          onChange={(aiScope) => onFiltersChange({ ...filters, aiScope })}
        />
        <FilterSection
          title="Applies to"
          options={APPLIES_TO_OPTIONS}
          selected={filters.type}
          onChange={(type) => onFiltersChange({ ...filters, type })}
        />
        {creatorOptions.length > 0 && (
          <FilterSection
            title="Added by"
            options={creatorOptions}
            selected={filters.createdBy}
            onChange={(createdBy) => onFiltersChange({ ...filters, createdBy })}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
