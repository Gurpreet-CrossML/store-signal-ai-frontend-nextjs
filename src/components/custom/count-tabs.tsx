"use client";

import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

/** One tab: its key, label and, once loaded, how many rows it holds. */
export type CountTab<T extends string> = {
  key: T;
  label: string;
  count?: number;
  /** The count's colour while the tab is not open. */
  tone?: BadgeTone;
};

/** A row of underlined tabs over a list, each with its count. */
export function CountTabs<T extends string>({
  tabs,
  tab,
  onChange,
}: {
  tabs: CountTab<T>[];
  tab: T;
  onChange: (tab: T) => void;
}) {
  return (
    <div className="scrollbar-hidden flex overflow-x-auto overflow-y-hidden border-b">
      {tabs.map((option) => {
        const isActive = option.key === tab;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(option.key)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
            {option.count !== undefined ? (
              <span
                className={cn(
                  "rounded-md border px-1.5 text-xs tabular-nums",
                  BADGE_TONE_STYLES[
                    isActive ? "accent" : (option.tone ?? "neutral")
                  ],
                )}
              >
                {option.count.toLocaleString()}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
