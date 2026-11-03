"use client";

import { IconClockExclamation, IconClockHour4 } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import { BADGE_TONE_STYLES } from "@/lib/badge-tones";
import { formatDateTime } from "@/lib/helpers";
import {
  formatMinutes,
  SLA_STATUS_TONE,
  SLA_TARGET_KEYS,
  SLA_TARGET_LABELS,
  slaAttention,
  slaTargetLabel,
  slaTargetStatus,
} from "@/lib/sla";
import { useNow } from "@/hooks/use-now";
import type {
  SlaTarget,
  SupportTicketSla,
} from "@/redux/api-slice/support-ticket-slice";

/** What the tooltip of a target says: its length, deadline and outcome. */
function describeTarget(target: SlaTarget): string {
  const parts: string[] = [];
  if (target.target_minutes) {
    parts.push(`Target ${formatMinutes(target.target_minutes)}`);
  }
  if (target.due_at) parts.push(`due ${formatDateTime(target.due_at)}`);
  if (target.completed_at) {
    parts.push(`met ${formatDateTime(target.completed_at)}`);
  } else if (target.breached_at) {
    parts.push(`found breached ${formatDateTime(target.breached_at)}`);
  }
  return parts.join(" · ");
}

/**
 * The SLA a ticket follows: the tag that triggered it, and where the ticket
 * stands on each target. Nothing is shown for a ticket without an SLA.
 *
 * One scrolling line, so the header keeps its height however many targets
 * the tag sets.
 */
export function TicketSla({
  sla,
}: {
  sla: SupportTicketSla | null | undefined;
}) {
  // Counts seconds down, so it ticks every second. Only one of these is ever
  // on screen (the open ticket's header), unlike the rows of the list.
  const now = useNow(1000);
  if (!sla) return null;

  const targets = SLA_TARGET_KEYS.filter((key) => sla[key].due_at);

  return (
    <div className="scrollbar-none flex items-center gap-2 overflow-x-auto *:shrink-0">
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconClockHour4 className="size-4" aria-hidden />
            SLA from
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-64">
          The tag with the lowest priority order decides the SLA of a ticket.
        </TooltipContent>
      </Tooltip>

      <TagBadge
        tag={{
          id: sla.tag.id,
          name: sla.tag.name,
          color: sla.tag.color,
          description: "",
        }}
      />

      {targets.map((key) => {
        const target = sla[key];
        const status = slaTargetStatus(target, now);
        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={BADGE_TONE_STYLES[SLA_STATUS_TONE[status]]}
              >
                {SLA_TARGET_LABELS[key]} · {slaTargetLabel(target, now)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{describeTarget(target)}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

/**
 * A small mark for a ticket row when its SLA has been missed (red) or is about
 * to be (amber). Renders nothing otherwise, so the row stays quiet until it
 * matters.
 */
export function TicketSlaIndicator({
  sla,
}: {
  sla: SupportTicketSla | null | undefined;
}) {
  const now = useNow();
  const attention = slaAttention(sla, now);
  if (!attention) return null;

  const breached = attention === "breached";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={breached ? "SLA breached" : "SLA due soon"}
          className="flex items-center"
        >
          <IconClockExclamation
            className={
              breached
                ? "size-3.5 text-destructive"
                : "size-3.5 text-amber-600 dark:text-amber-400"
            }
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {breached ? "SLA breached" : "SLA due soon"}
      </TooltipContent>
    </Tooltip>
  );
}
