"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CommentTopic } from "@/redux/api-slice/social-ai-slice";
import { IconChevronDown } from "@tabler/icons-react";

/** Mirrors the backend's CommentIntent / CommentSentiment choices. */
const INTENT_OPTIONS = [
  { value: "question", label: "Question" },
  { value: "complaint", label: "Complaint" },
  { value: "praise", label: "Praise" },
  { value: "feedback", label: "Feedback" },
  { value: "purchase_intent", label: "Purchase Intent" },
  { value: "other", label: "Other" },
];

const SENTIMENT_OPTIONS = [
  { value: "positive", label: "Positive" },
  { value: "neutral", label: "Neutral" },
  { value: "negative", label: "Negative" },
];

const ANY = "any";

export type CommentFilters = {
  intent: string;
  sentiment: string;
  // Topic slugs; a comment matches if it carries any of them.
  topics: string[];
  sarcastic: boolean;
  critical: boolean;
  spam: boolean;
};

export const EMPTY_COMMENT_FILTERS: CommentFilters = {
  intent: ANY,
  sentiment: ANY,
  topics: [],
  sarcastic: false,
  critical: false,
  spam: false,
};

export function countActiveCommentFilters(filters: CommentFilters) {
  return (
    (filters.intent !== ANY ? 1 : 0) +
    (filters.sentiment !== ANY ? 1 : 0) +
    (filters.topics.length > 0 ? 1 : 0) +
    (filters.sarcastic ? 1 : 0) +
    (filters.critical ? 1 : 0) +
    (filters.spam ? 1 : 0)
  );
}

function FlagToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}

/** Filter bar for a post's comments, over what the AI tagged. */
export function CommentFiltersBar({
  filters,
  topics,
  onChange,
}: {
  filters: CommentFilters;
  // Only the tags actually present on this post's comments.
  topics: CommentTopic[];
  onChange: (filters: CommentFilters) => void;
}) {
  const activeCount = countActiveCommentFilters(filters);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={filters.intent}
        onValueChange={(intent) => onChange({ ...filters, intent })}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Any intent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any intent</SelectItem>
          {INTENT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.sentiment}
        onValueChange={(sentiment) => onChange({ ...filters, sentiment })}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Any sentiment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any sentiment</SelectItem>
          {SENTIMENT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {topics.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-40 justify-between"
            >
              <span className="truncate">
                {filters.topics.length ? "Tags" : "Any tag"}
              </span>
              <span className="flex items-center gap-1">
                {filters.topics.length > 0 && (
                  <Badge variant="secondary">{filters.topics.length}</Badge>
                )}
                <IconChevronDown className="size-4 text-muted-foreground" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-72 overflow-y-auto"
          >
            {topics.map((topic) => (
              <DropdownMenuCheckboxItem
                key={topic.slug}
                checked={filters.topics.includes(topic.slug)}
                // Radix closes on select by default; keep it open so several
                // tags can be ticked in one go.
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    topics: checked
                      ? [...filters.topics, topic.slug]
                      : filters.topics.filter((slug) => slug !== topic.slug),
                  })
                }
              >
                {topic.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <FlagToggle
        label="Sarcastic"
        active={filters.sarcastic}
        onToggle={() => onChange({ ...filters, sarcastic: !filters.sarcastic })}
      />
      <FlagToggle
        label="Critical"
        active={filters.critical}
        onToggle={() => onChange({ ...filters, critical: !filters.critical })}
      />
      <FlagToggle
        label="Spam"
        active={filters.spam}
        onToggle={() => onChange({ ...filters, spam: !filters.spam })}
      />

      {activeCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_COMMENT_FILTERS)}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
