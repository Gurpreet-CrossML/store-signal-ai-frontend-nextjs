"use client";

import { useState } from "react";
import {
  IconArrowBackUp,
  IconArrowRight,
  IconCircleCheck,
  IconHistory,
  IconPlus,
  IconRefresh,
  IconUserCheck,
  type Icon,
} from "@tabler/icons-react";

import { LoadingState } from "@/components/custom/loading-state";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { BADGE_TONE_STYLES, type BadgeTone } from "@/lib/badge-tones";
import { TICKET_STATUS_TONES } from "@/components/custom/support-ticket-card";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { capitalizeText, formatDate } from "@/lib/helpers";
import {
  SupportTicketActivityFetch,
  type SupportTicketActivityItem,
} from "@/redux/api-slice/support-ticket-slice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";

/** How a creator value reads in the timeline: "ai" is an acronym, the rest are words. */
const CREATED_BY_LABEL: Record<string, string> = {
  ai: "AI",
  agent: "an agent",
  rule: "a rule",
};

function statusTone(status: string | null): BadgeTone {
  return (status && TICKET_STATUS_TONES[status]) || "neutral";
}

/** A status as the same pill used on tickets elsewhere. */
function StatusPill({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", BADGE_TONE_STYLES[statusTone(status)])}
    >
      {status}
    </Badge>
  );
}

/** What an entry looks like in the timeline: its mark, its colour and its sentence. */
function present(item: SupportTicketActivityItem): {
  icon: Icon;
  title: React.ReactNode;
  by: string | null;
} {
  if (item.type === "created") {
    const creator = item.to_value
      ? (CREATED_BY_LABEL[item.to_value] ?? capitalizeText(item.to_value))
      : null;
    return {
      icon: IconPlus,
      title: "Ticket created",
      by: item.actor ?? creator,
    };
  }

  if (item.type === "status_changed") {
    const to = item.to_value ?? "";
    return {
      icon:
        to === "reopen"
          ? IconArrowBackUp
          : to === "resolved" || to === "closed"
            ? IconCircleCheck
            : IconRefresh,
      title: (
        <span className="flex flex-wrap items-center gap-1.5">
          {/* One text run, so the words keep real spaces between them. */}
          <span>Status changed {item.from_value ? "from" : "to"}</span>
          {item.from_value ? (
            <>
              <StatusPill status={item.from_value} />
              <IconArrowRight className="size-3.5 text-muted-foreground" />
            </>
          ) : null}
          <StatusPill status={to} />
        </span>
      ),
      by: item.actor,
    };
  }

  const name = (value: string) => (
    <span className="font-medium text-foreground">{value}</span>
  );
  return {
    icon: IconUserCheck,
    title: !item.to_value ? (
      <>Unassigned {item.from_value ? name(item.from_value) : null}</>
    ) : !item.from_value ? (
      <>Assigned to {name(item.to_value)}</>
    ) : (
      <>
        Reassigned from {name(item.from_value)} to {name(item.to_value)}
      </>
    ),
    by: item.actor,
  };
}

/**
 * The entries already in the store, newest first, as a timeline: a rail with
 * a dot per entry, each entry a card with its mark, sentence, who did it and
 * when.
 */
function ActivityTimeline() {
  const {
    SupportTicketActivityFetchData,
    SupportTicketActivityFetchIsLoading,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketActivityFetchState,
  );

  if (SupportTicketActivityFetchIsLoading) {
    return <LoadingState label="Loading activity…" className="py-4" />;
  }
  if (SupportTicketActivityFetchData.length === 0) {
    return <Typography variant="muted">No activity yet.</Typography>;
  }
  return (
    <ol
      className={cn(
        "relative flex flex-col gap-2",
        // The rail, running behind the dots from the first to the last.
        "before:absolute before:top-3 before:bottom-3 before:left-[5.5px] before:w-px before:bg-border",
      )}
    >
      {SupportTicketActivityFetchData.map((item, index) => {
        const { icon: ItemIcon, title, by } = present(item);
        return (
          <li
            key={`${item.type}-${item.created_at}-${index}`}
            className="relative flex items-start gap-2.5"
          >
            <span
              aria-hidden
              className="z-10 mt-4 size-3 shrink-0 rounded-full bg-primary ring-4 ring-background"
            />
            <div className="flex min-w-0 flex-1 items-start gap-2.5 rounded-lg border p-2.5">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <ItemIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <Typography
                  variant="small"
                  as="div"
                  className="leading-snug font-normal text-foreground"
                >
                  {title}
                </Typography>
                {/* Who and when share one quiet line under the sentence,
                    so the sentence keeps the card's full width instead of
                    wrapping beside a date column. */}
                <Typography variant="caption" as="p" className="mt-0.5">
                  {by ? `by ${by} · ` : null}
                  <time dateTime={item.created_at}>
                    {formatDate(item.created_at)},{" "}
                    {new Date(item.created_at).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </time>
                </Typography>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The ticket's history — creation, status changes and assignments, newest
 * first — in a drawer from the right, opened by a button in the ticket
 * header. Loaded each time it opens, so it is always current and costs
 * nothing for tickets nobody inspects.
 */
export function TicketActivityDrawer({
  storeCode,
  ticketId,
  className,
}: {
  storeCode: string;
  ticketId: number;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next || !storeCode) return;
    dispatch(SupportTicketActivityFetch({ storeCode, ticketId }));
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Ticket activities"
            className={className}
            onClick={() => handleOpenChange(true)}
          >
            <IconHistory className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Activities</TooltipContent>
      </Tooltip>
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 p-0 data-[side=right]:sm:max-w-md"
        >
          <SheetHeader className="border-b">
            <SheetTitle>Ticket activities</SheetTitle>
            <SheetDescription className="sr-only">
              Creation, status changes and assignments for this ticket.
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            <ActivityTimeline />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
