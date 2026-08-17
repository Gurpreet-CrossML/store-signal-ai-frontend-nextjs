"use client";

import { IconFilter } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";
import type {
  AIScope,
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  AI_SCOPE_OPTIONS,
  KNOWLEDGE_SOURCE_LABEL,
  KNOWLEDGE_STATUS_META,
  KNOWLEDGE_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

export type KnowledgeFilterSelection = {
  types: KnowledgeType[];
  sources: KnowledgeSource[];
  statuses: KnowledgeStatus[];
  aiScopes: AIScope[];
};

export const EMPTY_KNOWLEDGE_FILTERS: KnowledgeFilterSelection = {
  types: [],
  sources: [],
  statuses: [],
  aiScopes: [],
};

export function countActiveKnowledgeFilters(
  filters: KnowledgeFilterSelection,
) {
  return (
    Number(filters.types.length > 0) +
    Number(filters.sources.length > 0) +
    Number(filters.statuses.length > 0) +
    Number(filters.aiScopes.length > 0)
  );
}

const SOURCE_OPTIONS = Object.entries(KNOWLEDGE_SOURCE_LABEL).map(
  ([value, label]) => ({ value: value as KnowledgeSource, label }),
);

const STATUS_OPTIONS = Object.entries(KNOWLEDGE_STATUS_META).map(
  ([value, meta]) => ({ value: value as KnowledgeStatus, label: meta.label }),
);

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

function ToggleChips<T extends string>({
  options,
  selected,
  onToggle,
}: {
  options: readonly { value: T; label: string }[];
  selected: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const isOn = selected.includes(option.value);
        return (
          <button key={option.value} type="button" onClick={() => onToggle(option.value)}>
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

export function KnowledgeFilterPopover({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  activeCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: KnowledgeFilterSelection;
  onFiltersChange: (filters: KnowledgeFilterSelection) => void;
  activeCount: number;
}) {
  const toggle =
    (key: keyof KnowledgeFilterSelection) => (value: string) =>
      onFiltersChange({
        ...filters,
        [key]: (filters[key] as string[]).includes(value)
          ? (filters[key] as string[]).filter((entry) => entry !== value)
          : [...(filters[key] as string[]), value],
      });

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" aria-label="Filter knowledge">
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
          <CardTitle>Filter knowledge</CardTitle>
        </div>

        <div className="max-h-[65vh] space-y-6 overflow-y-auto p-4">
          <FilterGroup title="Knowledge type">
            <ToggleChips
              options={KNOWLEDGE_TYPE_OPTIONS}
              selected={filters.types}
              onToggle={toggle("types") as (value: KnowledgeType) => void}
            />
          </FilterGroup>

          <FilterGroup title="Source">
            <ToggleChips
              options={SOURCE_OPTIONS}
              selected={filters.sources}
              onToggle={toggle("sources") as (value: KnowledgeSource) => void}
            />
          </FilterGroup>

          <FilterGroup title="Status">
            <ToggleChips
              options={STATUS_OPTIONS}
              selected={filters.statuses}
              onToggle={toggle("statuses") as (value: KnowledgeStatus) => void}
            />
          </FilterGroup>

          <FilterGroup title="AI scope">
            <ToggleChips
              options={AI_SCOPE_OPTIONS}
              selected={filters.aiScopes}
              onToggle={toggle("aiScopes") as (value: AIScope) => void}
            />
          </FilterGroup>
        </div>

        <div className="flex items-center justify-between border-t p-3">
          {activeCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFiltersChange(EMPTY_KNOWLEDGE_FILTERS)}
            >
              Clear
            </Button>
          ) : (
            <span />
          )}
          <Button size="sm" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
