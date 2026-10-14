"use client";

import {
  IconCircleCheck,
  IconHistory,
  IconPlus,
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
import { Typography } from "@/components/ui/typography";
import { capitalizeText, formatDateTime } from "@/lib/helpers";
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

const ACTIVITY_ICON: Record<SupportTicketActivityItem["type"], Icon> = {
  created: IconPlus,
  status_changed: IconCircleCheck,
  assigned: IconUserCheck,
};

/** The one-line sentence for an entry. */
function describe(item: SupportTicketActivityItem) {
  const actor = item.actor ?? "Someone";

  if (item.type === "created") {
    const by = item.to_value
      ? (CREATED_BY_LABEL[item.to_value] ?? capitalizeText(item.to_value))
      : null;
    // A named agent reads better than "an agent"; the AI and rules have no one to name.
    if (item.actor) return `Ticket created by ${item.actor}`;
    return by ? `Ticket created by ${by}` : "Ticket created";
  }

  if (item.type === "status_changed") {
    return `${actor} changed status ${
      item.from_value ? `${capitalizeText(item.from_value)} → ` : "to "
    }${capitalizeText(item.to_value ?? "")}`;
  }

  if (!item.to_value)
    return `${actor} unassigned ${item.from_value ?? ""}`.trim();
  if (!item.from_value) return `${actor} assigned to ${item.to_value}`;
  return `${actor} reassigned ${item.from_value} → ${item.to_value}`;
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
  const {
    SupportTicketActivityFetchData,
    SupportTicketActivityFetchIsLoading,
  } = useAppSelector(
    (state) => state.GetSupportTicketsReducer.SupportTicketActivityFetchState,
  );

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
        {SupportTicketActivityFetchIsLoading ? (
          <LoadingState label="Loading activity…" className="py-4" />
        ) : SupportTicketActivityFetchData.length === 0 ? (
          <Typography variant="muted">No activity yet.</Typography>
        ) : (
          <ol className="flex max-h-80 flex-col gap-3 overflow-y-auto">
            {SupportTicketActivityFetchData.map((item, index) => {
              const ItemIcon = ACTIVITY_ICON[item.type];
              return (
                <li
                  key={`${item.type}-${item.created_at}-${index}`}
                  className="flex gap-2.5"
                >
                  <ItemIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <Typography variant="small" as="p">
                      {describe(item)}
                    </Typography>
                    <Typography variant="muted">
                      {formatDateTime(item.created_at)}
                    </Typography>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </PopoverContent>
    </Popover>
  );
}
