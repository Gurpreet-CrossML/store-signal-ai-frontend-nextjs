"use client";

import { Typography } from "@/components/ui/typography";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { cn } from "@/lib/utils";

export function OptionCard({
  label,
  description,
  icon: Icon,
  tone,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof BADGE_TONE_STYLES;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-primary/5",
        selected && "border-primary/50 bg-primary/5",
      )}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          BADGE_TONE_STYLES[tone],
        )}
      >
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0">
        <Typography variant="small" as="p" className="font-medium">
          {label}
        </Typography>
        <Typography variant="muted" className="text-xs">
          {description}
        </Typography>
      </div>
    </button>
  );
}
