"use client";

import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";
import type {
  CustomerGroup,
  CustomerSummary,
} from "@/redux/api-slice/customer-slice";

/** A tab: every customer, one group, or those with an open ticket. */
export type CustomerTab = "all" | CustomerGroup | "open_tickets";

/** Used for the Lapsed tab's label until the summary arrives. */
const DEFAULT_LAPSED_DAYS = 90;

/** The tabs over the list, each with its store-wide count. */
export function CustomerTabs({
  tab,
  onChange,
  summary,
}: {
  tab: CustomerTab;
  onChange: (tab: CustomerTab) => void;
  summary: CustomerSummary | null;
}) {
  const groups = summary?.groups;
  const lapsedDays = summary?.lapsed_days ?? DEFAULT_LAPSED_DAYS;
  const tabs: {
    key: CustomerTab;
    label: string;
    count?: number;
    tone?: BadgeTone;
  }[] = [
    { key: "all", label: "All customers", count: summary?.total },
    { key: "vip", label: "VIP", count: groups?.vip },
    { key: "repeat", label: "Repeat", count: groups?.repeat },
    { key: "new", label: "New", count: groups?.new },
    {
      key: "at_risk",
      label: "At risk",
      count: groups?.at_risk,
      tone: "danger",
    },
    {
      key: "lapsed",
      label: `Lapsed ${lapsedDays}+ days`,
      count: groups?.lapsed,
    },
    {
      key: "never_ordered",
      label: "Never ordered",
      count: groups?.never_ordered,
    },
    {
      key: "open_tickets",
      label: "Open tickets",
      count: summary?.open_tickets,
      tone: "danger",
    },
  ];

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
