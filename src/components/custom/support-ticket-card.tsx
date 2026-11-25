"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IconExternalLink, IconInfoCircle } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import {
  TICKET_PRIORITY_TONES,
  ticketRef,
} from "@/components/custom/ticket-priority-bar";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { HELPDESK_CHANNEL_LABELS } from "@/lib/helpdesk-filters";
import { CHANNEL_META } from "@/lib/ticket-options";
import { capitalizeText, formatDate, formatDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { SupportTicketChannel } from "@/redux/api-slice/support-ticket-slice";
import type { ThreadTicketData } from "@/redux/api-slice/thread-slice";

export const TICKET_STATUS_TONES: Record<string, BadgeTone> = {
  open: "danger",
  reopen: "danger",
  snoozed: "warning",
  resolved: "success",
  closed: "neutral",
};

/** Still needing attention — these get the actions, and lead the list. */
export const LIVE_TICKET_STATUSES = ["open", "reopen", "snoozed"];

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 capitalize",
        BADGE_TONE_STYLES[TICKET_STATUS_TONES[status] ?? "neutral"],
      )}
    >
      {status}
    </Badge>
  );
}

/** One labelled fact in the detail dialog. */
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Typography variant="muted" as="span" className="shrink-0">
        {label}
      </Typography>
      <Typography variant="small" as="span" className="text-right font-normal">
        {value}
      </Typography>
    </div>
  );
}

/**
 * One support ticket in the conversation's detail panel.
 *
 * A ticket that is still open is the one an agent may need to act on, so
 * that is the only one that offers actions — reading the rest is enough.
 * They appear on hover rather than sitting there permanently, because the
 * panel stacks several of these and two buttons on every card is more
 * chrome than content.
 */
export function SupportTicketCard({
  ticket,
  index,
}: {
  ticket: ThreadTicketData;
  /** Position in the list, used to stagger the entrance. */
  index: number;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const isLive = LIVE_TICKET_STATUSES.includes(ticket.status);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18, delay: Math.min(index, 5) * 0.04 }}
        className={cn(
          "rounded-xl border border-border/60 p-3 transition-colors",
          isLive && "hover:bg-muted/50",
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Typography
              variant="small"
              as="p"
              className="truncate text-base font-semibold"
            >
              {ticket.subject || "Untitled Ticket"}
            </Typography>
            <StatusBadge status={ticket.status} />
          </div>

          {ticket.description && (
            <Typography
              variant="muted"
              className="mt-1 line-clamp-1 leading-snug"
            >
              {ticket.description}
            </Typography>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Typography variant="muted" as="span">
                {ticketRef(ticket.ticket_id)} · {formatDate(ticket.created_at)}
              </Typography>
              {ticket.priority ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "capitalize",
                    BADGE_TONE_STYLES[TICKET_PRIORITY_TONES[ticket.priority]],
                  )}
                >
                  {ticket.priority}
                </Badge>
              ) : null}
            </div>

            {/* Always on show rather than revealed on hover: a hover-only
              action is invisible until you happen to be over the right
              card, and unreachable on touch entirely. Help Desk is reached
              from the details popup, so the card has no second link. */}
            <div className="flex shrink-0 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Ticket details"
                    onClick={() => setShowDetails(true)}
                  >
                    <IconInfoCircle className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ticket Details</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent
          className="sm:max-w-lg"
          onInteractOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <DialogTitle className="text-left">
                {ticket.subject || "Untitled Ticket"}
              </DialogTitle>
              <StatusBadge status={ticket.status} />
            </div>
            <DialogDescription className="text-left">
              {ticketRef(ticket.ticket_id)} · Created{" "}
              {formatDateTime(ticket.created_at)}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            {ticket.description ? (
              <Typography variant="muted" className="wrap-break-word">
                {ticket.description}
              </Typography>
            ) : (
              <Typography variant="muted">
                No description on this ticket.
              </Typography>
            )}

            <div className="flex flex-col gap-2 border-t border-border pt-4">
              <DetailRow
                label="Priority"
                value={capitalizeText(ticket.priority) || "—"}
              />
              <DetailRow
                label="Channel"
                value={
                  HELPDESK_CHANNEL_LABELS[
                    ticket.channel as SupportTicketChannel
                  ] ??
                  CHANNEL_META[ticket.channel as SupportTicketChannel]?.label ??
                  (capitalizeText(ticket.channel) || "—")
                }
              />
              <DetailRow
                label="Last Updated"
                value={formatDateTime(ticket.updated_at)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
            <Button asChild>
              <a
                href={`/helpdesk?ticket=${ticket.url_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* A new tab: the agent is mid-conversation here. */}
                <IconExternalLink className="size-4" />
                Open In Help Desk
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
