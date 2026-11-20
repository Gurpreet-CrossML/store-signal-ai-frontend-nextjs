"use client";

import { useMemo } from "react";

import { IconChevronDown } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** One choice in a `CheckboxMultiSelect`. */
export type CheckboxOption = {
  value: string;
  label: string;
  /** A smaller second line under the label, e.g. an email. */
  hint?: string;
  /** Shown right after the label, e.g. a role pill. */
  badge?: React.ReactNode;
};

/** Chosen labels shown on the button; the rest become "+N". */
const SHOWN_LABELS = 2;

/**
 * A button that opens a list of checkboxes. The button shows the first two
 * chosen labels and "+N" for the rest; the list has "N Chosen" and Clear on
 * top. Used for knowledge categories and the live chat assignee filter.
 */
export function CheckboxMultiSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyMessage,
  isLoading = false,
  disabled = false,
}: {
  options: CheckboxOption[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyMessage: string;
  isLoading?: boolean;
  disabled?: boolean;
}) {
  // In the order they were chosen.
  const selected = useMemo(
    () =>
      value
        .map((chosen) => options.find((option) => option.value === chosen))
        .filter((option): option is CheckboxOption => Boolean(option)),
    [options, value],
  );

  const toggle = (option: CheckboxOption, checked: boolean) =>
    onChange(
      checked
        ? [...value, option.value]
        : value.filter((chosen) => chosen !== option.value),
    );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          title={selected.map((option) => option.label).join(", ") || undefined}
          className="w-full min-w-0 justify-between gap-2 font-normal"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-left",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            {selected.length > 0
              ? selected
                  .slice(0, SHOWN_LABELS)
                  .map((option) => option.label)
                  .join(", ")
              : placeholder}
          </span>
          {selected.length > SHOWN_LABELS && (
            <span className="shrink-0 rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
              +{selected.length - SHOWN_LABELS}
            </span>
          )}
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) min-w-56 gap-2 p-2"
      >
        <div className="flex items-center justify-between px-1.5 text-xs">
          <span className="text-muted-foreground">
            {selected.length === 0
              ? "None chosen"
              : `${selected.length} Chosen`}
          </span>
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={() => onChange([])}
            className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-50"
          >
            Clear
          </button>
        </div>
        <ul className="flex max-h-60 flex-col overflow-y-auto">
          {options.length === 0 && (
            <li className="px-1.5 py-2 text-sm text-muted-foreground">
              {isLoading ? "Loading…" : emptyMessage}
            </li>
          )}
          {options.map((option) => (
            <li key={option.value}>
              <label className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted">
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={(checked) =>
                    toggle(option, checked === true)
                  }
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate">{option.label}</span>
                    {option.badge}
                  </span>
                  {option.hint && (
                    <span className="truncate text-xs text-muted-foreground">
                      {option.hint}
                    </span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
