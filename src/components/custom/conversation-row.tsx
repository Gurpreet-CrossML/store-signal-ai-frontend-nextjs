"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import { cn } from "@/lib/utils";

/**
 * The shape every list row shares: inset, rounded, filled when selected,
 * and no rule between rows — the fill is what separates them.
 *
 * Exported because not every list holds conversations. The post feed's row
 * carries a thumbnail, a caption and engagement counts rather than a
 * person, so it cannot use ConversationRow's slots, but it must look like
 * it belongs to the same product.
 */
export function listRowClassName(active?: boolean) {
  return cn(
    "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
    active ? "bg-accent" : "hover:bg-muted/60",
  );
}

/**
 * One row in a conversation list — a Help Desk ticket, a Live Support chat.
 *
 * Both lists are the same object: who it is with, when it last moved, a
 * teaser of the latest message, and something small underneath. They had
 * drifted into two layouts with different padding, borders and unread
 * treatments, so the same customer looked like a different kind of thing
 * depending on which screen you were on.
 *
 * Everything that varies is a slot, so neither caller has to reproduce the
 * geometry to add its own detail.
 */
export function ConversationRow({
  accent,
  avatar,
  title,
  titleTooltip,
  unread = false,
  timestamp,
  indicator,
  preview,
  previewLines = 1,
  footer,
  active = false,
  onSelect,
}: {
  /**
   * A full-height stripe down the row's leading edge, before the avatar —
   * a ticket's priority. Optional: a list whose rows have no such ranking
   * leaves it out and loses the column entirely.
   */
  accent?: React.ReactNode;
  avatar: React.ReactNode;
  title: React.ReactNode;
  /**
   * The full title, shown on hover. Rows are narrow and titles get cut, so
   * this is how a reader sees the rest without opening the row.
   */
  titleTooltip?: string;
  /** Weights the title and teaser — an unread row should catch the eye. */
  unread?: boolean;
  timestamp: string;
  /** Sits beside the timestamp: an unread dot, a snooze bell. */
  indicator?: React.ReactNode;
  preview: React.ReactNode;
  previewLines?: 1 | 2;
  /** The row's last line — tags, a message count. */
  footer?: React.ReactNode;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      // `items-start` in the shared class is load-bearing here: the avatar
      // slot positions its own online dot against a `relative` wrapper, and
      // under the flex default of `stretch` that wrapper grows to the row's
      // full height, dropping the dot to the bottom of the card.
      className={listRowClassName(active)}
    >
      {accent}
      {avatar}

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          {titleTooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "truncate text-sm text-foreground",
                    unread ? "font-semibold" : "font-normal",
                  )}
                >
                  {title}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-80">
                {titleTooltip}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span
              className={cn(
                "truncate text-sm text-foreground",
                unread ? "font-semibold" : "font-normal",
              )}
            >
              {title}
            </span>
          )}
          <div className="flex shrink-0 items-center gap-1">
            {indicator}
            <Typography variant="caption">{timestamp}</Typography>
          </div>
        </div>

        {/* Literal classes, not a template — the Tailwind scanner reads
            source text, so a computed `line-clamp-${n}` never ships. */}
        <div
          className={cn(
            "mt-0.5 text-xs [&_p]:inline",
            previewLines === 2 ? "line-clamp-2" : "truncate",
            unread ? "font-medium text-foreground/80" : "text-muted-foreground",
          )}
        >
          {preview}
        </div>

        {footer ? <div className="mt-1.5">{footer}</div> : null}
      </div>
    </button>
  );
}
