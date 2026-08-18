"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  KnowledgeSource,
  KnowledgeStatus,
  KnowledgeType,
} from "@/redux/api-slice/knowledge-rag-slice";
import {
  KNOWLEDGE_SOURCE_LABEL,
  KNOWLEDGE_STATUS_META,
  KNOWLEDGE_TYPE_OPTIONS,
} from "@/components/custom/knowledge/knowledge-meta";

export type KnowledgeFilterSelection = {
  type: KnowledgeType | "";
  source: KnowledgeSource | "";
  status: KnowledgeStatus | "";
};

export const EMPTY_KNOWLEDGE_FILTERS: KnowledgeFilterSelection = {
  type: "",
  source: "",
  status: "",
};

export function countActiveKnowledgeFilters(filters: KnowledgeFilterSelection) {
  return (
    Number(filters.type !== "") +
    Number(filters.source !== "") +
    Number(filters.status !== "")
  );
}

const SOURCE_OPTIONS = Object.entries(KNOWLEDGE_SOURCE_LABEL).map(
  ([value, label]) => ({ value: value as KnowledgeSource, label }),
);

const STATUS_OPTIONS = Object.entries(KNOWLEDGE_STATUS_META).map(
  ([value, meta]) => ({ value: value as KnowledgeStatus, label: meta.label }),
);

// Radix Select forbids empty-string item values, so "All" uses a sentinel
// that maps back to "" (filter off) in state — same pattern as the Threads
// screen's filter bar (thread-filteration.tsx).
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

/** Type / source / status filters — single-select dropdowns, one per field. */
export function KnowledgeTypeSourceStatusFilters({
  filters,
  onFiltersChange,
}: {
  filters: KnowledgeFilterSelection;
  onFiltersChange: (filters: KnowledgeFilterSelection) => void;
}) {
  return (
    <>
      <FilterSelect
        ariaLabel="Filter by knowledge type"
        value={filters.type}
        onChange={(type) =>
          onFiltersChange({
            ...filters,
            type: type as KnowledgeFilterSelection["type"],
          })
        }
        options={[{ value: "", label: "All Types" }, ...KNOWLEDGE_TYPE_OPTIONS]}
      />

      <FilterSelect
        ariaLabel="Filter by source"
        value={filters.source}
        onChange={(source) =>
          onFiltersChange({
            ...filters,
            source: source as KnowledgeFilterSelection["source"],
          })
        }
        options={[{ value: "", label: "All Sources" }, ...SOURCE_OPTIONS]}
      />

      <FilterSelect
        ariaLabel="Filter by status"
        value={filters.status}
        onChange={(status) =>
          onFiltersChange({
            ...filters,
            status: status as KnowledgeFilterSelection["status"],
          })
        }
        options={[{ value: "", label: "All Statuses" }, ...STATUS_OPTIONS]}
      />
    </>
  );
}
