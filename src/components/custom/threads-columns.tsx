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
import type { Thread } from "@/redux/api-slice/thread-slice";
import Markdown from 'react-markdown';

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
  // Session — the thread id.
  {
    accessorKey: "id",
    header: "Session",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <span className="font-mono text-xs text-muted-foreground" title={id}>
          {id}
        </span>
      );
    },
  },

  // Customer — name as primary text, email as sub-text.
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {customer?.name || "Anonymous"}
          </span>
          {
            customer?.email &&
            <span className="text-xs text-muted-foreground">
              {customer?.email || "—"}
            </span>
          }

        </div>
      );
    },
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
      <div className="text-right tabular-nums">
        {row.original.total_messages}
      </div>
    ),
  },

  // Last Message — what the last message was in the thread.
  {
    accessorKey: "last_message",
    header: "Last Message",
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
        <Markdown>
          {row.original.last_message || "—"}
        </Markdown>
      </span>
    ),
  },

  // Started At — when the thread was created.
  {
    accessorKey: "created_at",
    header: "Started At",
    cell: ({ row }) => (
      <span className="text-muted-foreground whitespace-nowrap">
        {formatDateTime(row.original.created_at)}
      </span>
    ),
  },
];
