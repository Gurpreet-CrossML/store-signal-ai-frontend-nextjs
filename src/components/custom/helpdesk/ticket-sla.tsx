"use client";

import { IconClockExclamation } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDateTime } from "@/lib/helpers";
import {
  formatMinutes,
  SLA_TARGET_LABELS,
  slaBreachLabel,
  slaNearestBreach,
  type SlaBreach,
} from "@/lib/sla";
import { useNow } from "@/hooks/use-now";
import type { SupportTicketSla } from "@/redux/api-slice/support-ticket-slice";

/** What the tooltip says about the missed target: which, its length and deadline. */
function describeBreach({ key, target }: SlaBreach): string {
  const parts = [SLA_TARGET_LABELS[key]];
  if (target.target_minutes) {
    parts.push(`target ${formatMinutes(target.target_minutes)}`);
  }
  if (target.due_at) parts.push(`due ${formatDateTime(target.due_at)}`);
  return parts.join(" · ");
}

/**
 * The SLA of an open ticket, shown only when it has been missed: a red
 * "Overdue 5m" for the target that has been overdue the longest. Nothing is
 * shown while a ticket is on track, due soon or has met its targets.
 */
export function TicketSla({
  sla,
}: {
  sla: SupportTicketSla | null | undefined;
}) {
  // Counts seconds up, so it ticks every second. Only one of these is ever
  // on screen (the open ticket's header), unlike the rows of the list.
  const now = useNow(1000);
  const breach = slaNearestBreach(sla, now);
  if (!breach) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={BADGE_TONE_STYLES.danger}>
          <IconClockExclamation className="size-3.5" aria-hidden />
          {slaBreachLabel(breach)}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{describeBreach(breach)}</TooltipContent>
    </Tooltip>
  );
}

/**
 * A small red mark for a ticket row whose SLA has been missed. Renders nothing
 * otherwise, so the row stays quiet until it matters.
 */
export function TicketSlaIndicator({
  sla,
}: {
  sla: SupportTicketSla | null | undefined;
}) {
  const now = useNow();
  const breach = slaNearestBreach(sla, now);
  if (!breach) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={slaBreachLabel(breach)}
          className="flex items-center"
        >
          <IconClockExclamation className="size-3.5 text-destructive" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{slaBreachLabel(breach)}</TooltipContent>
    </Tooltip>
  );
}
