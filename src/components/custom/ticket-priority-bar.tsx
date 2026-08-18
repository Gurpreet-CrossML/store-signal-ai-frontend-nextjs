"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BAR_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { capitalizeText } from "@/lib/helpers";
import { cn } from "@/lib/utils";

/**
 * Both slices declare this union separately (`TicketPriority` on threads,
 * `SupportTicketPriority` on the help desk) and they are the same four
 * values, so the tone map is typed on the values themselves and fits
 * either caller.
 */
export type TicketPriorityValue = "low" | "normal" | "high" | "urgent";

/**
 * One priority, one colour, everywhere a ticket appears — the help desk
 * list, the detail panel beside a conversation, the thread screen.
 */
export const TICKET_PRIORITY_TONES: Record<TicketPriorityValue, BadgeTone> = {
  low: "success",
  normal: "neutral",
  high: "warning",
  urgent: "danger",
};

/**
 * How a ticket is referred to in the UI. Prefixed rather than bare, so a
 * number on screen says what it is a number *of* — an id, an order and a
 * thread all read as "#1118" otherwise.
 */
export function ticketRef(id: string | number) {
  return `TCK-${id}`;
}

/**
 * The priority stripe down the left of a ticket.
 *
 * Always rendered, including for "normal" — a bar that appears only on
 * urgent tickets shifts every other row's text sideways, and scanning a
 * list depends on the rows lining up. Colour is what varies; a normal
 * ticket gets the neutral border tone and simply recedes.
 *
 * The colour alone means nothing to a new agent, so the name is one hover
 * away rather than printed on every row.
 */
export function TicketPriorityBar({
  priority,
  className,
}: {
  priority: TicketPriorityValue;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "w-1 shrink-0 self-stretch rounded-full",
            BAR_TONE_STYLES[TICKET_PRIORITY_TONES[priority] ?? "neutral"],
            className,
          )}
        />
      </TooltipTrigger>
      <TooltipContent>{capitalizeText(priority)} Priority</TooltipContent>
    </Tooltip>
  );
}
