"use client";

import { useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ShowMoreToggle,
  useCollapsibleList,
} from "@/components/custom/collapsible-list";
import { Badge } from "@/components/ui/badge";
import { CardTitle } from "@/components/ui/card";
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
          Status changed
          {item.from_value ? (
            <>
              from <StatusPill status={item.from_value} />
              <IconArrowRight className="size-3.5 text-muted-foreground" />
            </>
          ) : (
            "to"
          )}
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
 * when. `collapsible` shows the first few behind a Show More toggle for the
 * side pane; without it the list scrolls inside its popover.
 */
function ActivityTimeline({ collapsible }: { collapsible?: boolean }) {
  const {
    SupportTicketActivityFetchData,
    SupportTicketActivityFetchIsLoading,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketActivityFetchState,
  );
  const { visible, hiddenCount, expanded, toggle } = useCollapsibleList(
    SupportTicketActivityFetchData,
    collapsible ? 3 : SupportTicketActivityFetchData.length,
  );

  if (SupportTicketActivityFetchIsLoading) {
    return <LoadingState label="Loading activity…" className="py-4" />;
  }
  if (SupportTicketActivityFetchData.length === 0) {
    return <Typography variant="muted">No activity yet.</Typography>;
  }
  return (
    <>
      <ol
        className={cn(
          "relative flex flex-col gap-2",
          // The rail, running behind the dots from the first to the last.
          "before:absolute before:top-3 before:bottom-3 before:left-[5.5px] before:w-px before:bg-border",
          !collapsible && "max-h-80 overflow-y-auto",
        )}
      >
        {visible.map((item, index) => {
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
      {collapsible ? (
        <ShowMoreToggle
          hiddenCount={hiddenCount}
          expanded={expanded}
          onToggle={toggle}
          noun="entry"
          nounPlural="entries"
        />
      ) : null}
    </>
  );
}

/**
 * The ticket's audit trail as a section of the side pane. Loaded as the
 * ticket is opened, and again when `version` changes — pass something that
 * moves with the ticket (its status and update time) so a status change or
 * reassignment shows up without reopening the ticket.
 */
export function TicketAuditTrailCard({
  storeCode,
  ticketId,
  version,
}: {
  storeCode: string;
  ticketId: number;
  version?: string;
}) {
  const dispatch = useAppDispatch();
  const { SupportTicketActivityFetchData } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketActivityFetchState,
  );
  const count = SupportTicketActivityFetchData.length;

  useEffect(() => {
    if (!storeCode) return;
    dispatch(SupportTicketActivityFetch({ storeCode, ticketId }));
  }, [dispatch, storeCode, ticketId, version]);

  return (
    <section className="flex flex-col gap-3 border-b p-4">
      <CardTitle className="flex items-center gap-2">
        <IconHistory className="size-4" />
        Audit Trail
        {count ? (
          <Badge variant="secondary" className="font-normal">
            {count} {count === 1 ? "activity" : "activities"}
          </Badge>
        ) : null}
      </CardTitle>
      <ActivityTimeline collapsible />
    </section>
  );
}

/**
 * The ticket's history — creation, status changes and assignments, newest
 * first — behind one icon in the ticket header. Loaded when opened, so it is
 * always current and costs nothing for tickets nobody inspects.
 */
export function TicketActivityPopover({
  storeCode,
  ticketId,
}: {
  storeCode: string;
  ticketId: number;
}) {
  const dispatch = useAppDispatch();

  const handleOpenChange = (open: boolean) => {
    if (!open || !storeCode) return;
    dispatch(SupportTicketActivityFetch({ storeCode, ticketId }));
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon-sm" aria-label="Activity">
              <IconHistory className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Activity</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80">
        <PopoverHeader>
          <PopoverTitle>Activity</PopoverTitle>
        </PopoverHeader>
        <ActivityTimeline />
      </PopoverContent>
    </Popover>
  );
}
