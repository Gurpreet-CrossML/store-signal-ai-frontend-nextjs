"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  IconArrowUpRight,
  IconExternalLink,
  IconInfoCircle,
} from "@tabler/icons-react";

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
  TicketPriorityBar,
  TICKET_PRIORITY_TONES,
  ticketRef,
} from "@/components/custom/ticket-priority-bar";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { capitalizeText, formatDate, formatDateTime } from "@/lib/helpers";
import { cn } from "@/lib/utils";
import type { ThreadTicketData } from "@/redux/api-slice/thread-slice";

export const TICKET_STATUS_TONES: Record<string, BadgeTone> = {
  open: "danger",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
};

/** Still needing attention — these get the actions, and lead the list. */
export const LIVE_TICKET_STATUSES = ["open", "pending"];

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
          "flex items-stretch gap-2.5 rounded-xl border border-border/50 p-2.5 transition-colors",
          isLive && "hover:bg-muted/50",
        )}
      >
        <TicketPriorityBar priority={ticket.priority} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Typography variant="small" as="p" className="truncate">
              {ticket.subject || "Untitled ticket"}
            </Typography>
            <StatusBadge status={ticket.status} />
          </div>

          {ticket.description && (
            <Typography variant="muted" className="mt-1 line-clamp-2">
              {ticket.description}
            </Typography>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <Typography variant="muted" as="span">
                {ticketRef(ticket.id)} · {formatDate(ticket.created_at)}
              </Typography>
              {ticket.priority === "high" || ticket.priority === "urgent" ? (
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
              card, and unreachable on touch entirely. Two icons cost less
              room than the buttons they replace. */}
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
                <TooltipContent>Ticket details</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-xs" asChild>
                    {/* Opens in a new tab: the agent is mid-conversation
                      here, and this is somewhere else to work. */}
                    <a
                      href={`/helpdesk?ticket=${ticket.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open in Help Desk"
                    >
                      <IconArrowUpRight className="size-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open in Help Desk</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3 pr-6">
              <DialogTitle className="text-left">
                {ticket.subject || "Untitled ticket"}
              </DialogTitle>
              <StatusBadge status={ticket.status} />
            </div>
            <DialogDescription className="text-left">
              {ticketRef(ticket.id)} · raised{" "}
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
                value={capitalizeText(ticket.priority)}
              />
              <DetailRow
                label="Channel"
                value={capitalizeText(ticket.channel)}
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
                href={`/helpdesk?ticket=${ticket.id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink className="size-4" />
                Open in Help Desk
              </a>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
