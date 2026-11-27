"use client";

import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { formatDate } from "@/lib/helpers";
import { cn } from "@/lib/utils";

/** "shopify" → "Shopify"; the platform name shown on buttons and cards. */
export function platformName(platform: string) {
  const names: Record<string, string> = {
    shopify: "Shopify",
    magento: "Magento",
  };
  return (
    names[platform] ?? platform.charAt(0).toUpperCase() + platform.slice(1)
  );
}

/** "Today 2:04 AM", "Yesterday 9:12 AM", else the date. */
export function activityTime(value: string) {
  const date = new Date(value);
  const time = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  const days = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(value).setHours(0, 0, 0, 0)) /
      86_400_000,
  );
  if (days === 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  return formatDate(value);
}

export function TonePill({
  tone,
  children,
}: {
  tone: BadgeTone;
  children: React.ReactNode;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("font-normal", BADGE_TONE_STYLES[tone])}
    >
      {children}
    </Badge>
  );
}

/** A bordered block with a title row, like every card on a detail page. */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border", className)}>
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

/** One label and value line in a side card. */
export function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  );
}

/** A ticket's status as a coloured pill. */
export function TicketStatus({ status }: { status: string }) {
  const statuses: Record<string, { label: string; tone: BadgeTone }> = {
    open: { label: "Open", tone: "danger" },
    reopen: { label: "Reopened", tone: "danger" },
    snoozed: { label: "Snoozed", tone: "warning" },
    resolved: { label: "Resolved", tone: "success" },
    closed: { label: "Closed", tone: "neutral" },
  };
  const known = statuses[status] ?? { label: status, tone: "neutral" };
  return <TonePill tone={known.tone}>{known.label}</TonePill>;
}

/** A segmented All / … switch for a panel's title row. */
export function PanelSwitch<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-md bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2 py-0.5 text-xs transition-colors",
            value === option.value
              ? "bg-background font-medium shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
