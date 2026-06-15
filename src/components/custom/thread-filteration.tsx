"use client";

import {
  IconCircleCheck,
  IconCircleX,
  IconMessageCircle,
  IconSearch,
  IconTicket,
  IconUser,
  IconUserCheck,
  IconX,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FEEDBACK_RATINGS, type FeedbackRatingValue } from "@/lib/config";

export type FeedbackRating = "" | FeedbackRatingValue;

export type ThreadFilterState = {
  search: string;
  is_active: "" | "true" | "false";
  user_type: "" | "guest" | "logged_in";
  has_ticket: boolean;
  has_feedback: boolean;
  feedback_rating: FeedbackRating;
};

export const DEFAULT_THREAD_FILTERS: ThreadFilterState = {
  search: "",
  is_active: "",
  user_type: "",
  has_ticket: false,
  has_feedback: false,
  feedback_rating: "",
};

type ThreadFilterationProps = {
  filters: ThreadFilterState;
  onChange: (filters: ThreadFilterState) => void;
  onClear: () => void;
};

function FilterChip({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className="rounded-full"
      aria-pressed={active}
      onClick={onClick}
    >
      {icon}
      {label}
    </Button>
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
    filters.has_ticket ||
    filters.has_feedback ||
    filters.feedback_rating !== "";

  const toggleFeedback = () =>
    onChange({
      ...filters,
      has_feedback: !filters.has_feedback,
      // Rating only applies while feedback is on; clear it when toggling off.
      feedback_rating: filters.has_feedback ? "" : filters.feedback_rating,
    });

  const toggleRating = (value: Exclude<FeedbackRating, "">) =>
    onChange({
      ...filters,
      feedback_rating: filters.feedback_rating === value ? "" : value,
    });

  const toggleActive = (value: "true" | "false") =>
    onChange({
      ...filters,
      is_active: filters.is_active === value ? "" : value,
    });

  const toggleUserType = (value: "guest" | "logged_in") =>
    onChange({
      ...filters,
      user_type: filters.user_type === value ? "" : value,
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-56 flex-1">
        <IconSearch className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filters.search}
          onChange={(event) =>
            onChange({ ...filters, search: event.target.value })
          }
          placeholder="Search name, session, email…"
          className="pl-8"
        />
      </div>

      <Separator orientation="vertical" className="h-5" />

      <FilterChip
        active={filters.is_active === "true"}
        icon={<IconCircleCheck />}
        label="Active"
        onClick={() => toggleActive("true")}
      />
      <FilterChip
        active={filters.is_active === "false"}
        icon={<IconCircleX />}
        label="Closed"
        onClick={() => toggleActive("false")}
      />

      <FilterChip
        active={filters.user_type === "guest"}
        icon={<IconUser />}
        label="Guest"
        onClick={() => toggleUserType("guest")}
      />
      <FilterChip
        active={filters.user_type === "logged_in"}
        icon={<IconUserCheck />}
        label="Logged In"
        onClick={() => toggleUserType("logged_in")}
      />

      <FilterChip
        active={filters.has_ticket}
        icon={<IconTicket />}
        label="Ticket"
        onClick={() =>
          onChange({ ...filters, has_ticket: !filters.has_ticket })
        }
      />
      <FilterChip
        active={filters.has_feedback}
        icon={<IconMessageCircle />}
        label="Feedback"
        onClick={toggleFeedback}
      />

      {filters.has_feedback && (
        <>
          <Separator orientation="vertical" className="h-5" />
          {FEEDBACK_RATINGS.map((rating) => (
            <FilterChip
              key={rating.value}
              active={filters.feedback_rating === rating.value}
              label={rating.label}
              onClick={() => toggleRating(rating.value)}
            />
          ))}
        </>
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
