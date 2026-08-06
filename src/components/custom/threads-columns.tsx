"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
import type { Thread } from "@/redux/api-slice/thread-slice";
import Markdown from "react-markdown";

// Absolute, localized date-time e.g. "May 30, 2026, 2:14 PM".
function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

// Compact elapsed time between two timestamps, e.g. "4m", "1h 20m", "2d 3h".
function formatDuration(start: string, end: string | null | undefined): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (Number.isNaN(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "<1m";
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  return `${minutes}m`;
}

/**
 * Renders thread tags as badges, showing at most `MAX_VISIBLE_TAGS`.
 * Remaining tags collapse into a "+N more" badge the user can click to expand.
 *
 * Kept ready for when the API starts returning `tags: string[]` on a thread.
 * Exported so it is "used" even while the Tags column below is commented out.
 */
const MAX_VISIBLE_TAGS = 2;

export function TagsCell({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = tags.slice(0, MAX_VISIBLE_TAGS);
  const hidden = tags.slice(MAX_VISIBLE_TAGS);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((tag) => (
          <Tooltip key={tag}>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="font-normal">
                {tag}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>{tag}</TooltipContent>
          </Tooltip>
        ))}

        {hidden.length > 0 && (
          <HoverCard>
            <HoverCardTrigger asChild>
              <Badge
                variant="outline"
                className="cursor-default font-normal hover:bg-accent"
              >
                +{hidden.length} more
              </Badge>
            </HoverCardTrigger>
            <HoverCardContent
              align="start"
              className="flex w-auto max-w-xs flex-wrap gap-1.5"
            >
              {hidden.map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </HoverCardContent>
          </HoverCard>
        )}
      </div>
    </TooltipProvider>
  );
}

export const threadsColumns: ColumnDef<Thread>[] = [
  // Customer — name as primary text, email as sub-text.
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div className="flex flex-col gap-0.5">
          <Typography variant="small" as="span">
            {customer?.name || "Guest"}
          </Typography>
          {customer?.email && (
            <Typography variant="muted" as="span" className="text-xs">
              {customer.email}
            </Typography>
          )}
        </div>
      );
    },
  },

  // Topic — the conversation title, same one the detail drawer shows.
  {
    accessorKey: "topic",
    header: "Topic",
    cell: ({ row }) =>
      row.original.name ? (
        <Typography
          variant="small"
          as="span"
          className="block max-w-48 truncate font-normal"
          title={row.original.name}
        >
          {row.original.name}
        </Typography>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },

  {
    accessorKey: "tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => <TagsCell tags={row.original.tags ?? []} />,
  },

  // Status — active thread vs closed.
  {
    accessorKey: "is_active",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Closed"}
        </Badge>
      );
    },
  },

  // Messages — total message count for the thread.
  {
    accessorKey: "total_messages",
    header: () => <div className="text-right">Messages</div>,
    cell: ({ row }) => (
      <Typography
        variant="small"
        as="div"
        className="text-right tabular-nums font-normal"
      >
        {row.original.total_messages}
      </Typography>
    ),
  },

  // Duration — how long the conversation ran (created_at → ended_at).
  {
    accessorKey: "ended_at",
    header: "Duration",
    cell: ({ row }) => (
      <Typography
        variant="muted"
        as="span"
        className="whitespace-nowrap tabular-nums"
      >
        {row.original.is_active
          ? "Ongoing"
          : formatDuration(row.original.created_at, row.original.ended_at)}
      </Typography>
    ),
  },

  // Last Message — what the last message was in the thread.
  {
    accessorKey: "last_message",
    header: "Last Message",
    cell: ({ row }) => {
      let last_message = row.original.last_message;
      const last_message_splits = last_message?.split("\n");
      last_message = last_message_splits
        ? last_message_splits[0]
        : last_message;

      return (
        <Typography
          variant="muted"
          as="span"
          className="whitespace-nowrap overflow-hidden text-ellipsis *:truncate"
        >
          <Markdown>{last_message || "—"}</Markdown>
        </Typography>
      );
    },
  },

  // Started At — when the thread was created.
  {
    accessorKey: "created_at",
    header: "Started",
    cell: ({ row }) => (
      <Typography variant="muted" as="span" className="whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </Typography>
    ),
  },
];
