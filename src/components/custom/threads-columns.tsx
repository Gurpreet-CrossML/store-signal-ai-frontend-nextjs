"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { IconBrandWhatsapp, IconWorld } from "@tabler/icons-react";

import {
  HiddenTagsBadge,
  TagBadge,
} from "@/components/custom/helpdesk/tag-badge";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import type { SupportTicketTagData } from "@/redux/api-slice/support-ticket-slice";
import type { Thread } from "@/redux/api-slice/thread-slice";
import Markdown from "react-markdown";

// Time of day only, e.g. "2:14 PM" — the date comes from the group header.
function formatTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(date);
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
 * A thread's tags, as the two shapes the API actually sends.
 *
 * The threads list returns full tag records; the thread detail endpoint
 * returns bare names. Both reach this cell, and a record rendered as a
 * React child is what crashed the Threads page.
 */
export type ThreadTag = string | SupportTicketTagData;

/** Bare names get the neutral chip; records keep the colour they were given. */
function toTagRecord(tag: ThreadTag): SupportTicketTagData {
  return typeof tag === "string"
    ? { name: tag, color: "", description: "" }
    : tag;
}

const MAX_VISIBLE_TAGS = 2;

/**
 * A thread's tags, at most `MAX_VISIBLE_TAGS` of them, the rest behind a
 * "+N" hover card.
 *
 * Draws them with the shared TagBadge rather than its own grey chip: a tag
 * was already three different shapes across the app before that component
 * existed, and this was quietly becoming a fourth.
 */
export function TagsCell({ tags }: { tags: ThreadTag[] }) {
  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const records = tags.map(toTagRecord);
  const visible = records.slice(0, MAX_VISIBLE_TAGS);
  const hidden = records.slice(MAX_VISIBLE_TAGS);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag, index) => (
        // Names are unique per thread, and are the only stable identity a
        // bare-string tag has.
        <TagBadge key={tag.id ?? `${tag.name}-${index}`} tag={tag} />
      ))}

      {hidden.length > 0 ? (
        <HiddenTagsBadge tags={hidden} label={`+${hidden.length}`} />
      ) : null}
    </div>
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
            {customer?.name || customer?.email || "Guest"}
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

  // Channel — derived from the thread source: WhatsApp, or Web for
  // native/webhook threads.
  {
    accessorKey: "source",
    header: "Channel",
    cell: ({ row }) => {
      const source = row.original.source;
      if (!source) return <span className="text-muted-foreground">—</span>;
      const isWhatsapp = source === "whatsapp";
      return (
        <Badge
          variant="outline"
          className={
            isWhatsapp
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-blue-200 bg-blue-50 text-blue-700"
          }
        >
          {isWhatsapp ? <IconBrandWhatsapp /> : <IconWorld />}
          {isWhatsapp ? "WhatsApp" : "Web"}
        </Badge>
      );
    },
  },

  // Topic · Last Message — the conversation title with the last assistant
  // message beneath it.
  {
    accessorKey: "topic",
    header: "Topic · Last Message",
    cell: ({ row }) => {
      const { name, last_message } = row.original;
      const firstLine = last_message?.split("\n")[0];

      return (
        <div className="flex max-w-64 flex-col gap-0.5">
          <Typography
            variant="small"
            as="span"
            className={`truncate ${name ? "" : "font-normal text-muted-foreground"}`}
            title={name ?? undefined}
          >
            {name || "No messages yet"}
          </Typography>
          <Typography
            variant="muted"
            as="span"
            className="truncate text-xs *:truncate"
          >
            <Markdown>{firstLine || "—"}</Markdown>
          </Typography>
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
        <Badge
          variant="secondary"
          className={
            isActive
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          }
        >
          <span className="size-1.5 rounded-full bg-current" />
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
        className={`whitespace-nowrap tabular-nums ${
          row.original.is_active ? "font-medium text-primary" : ""
        }`}
      >
        {row.original.is_active
          ? "Ongoing"
          : formatDuration(row.original.created_at, row.original.ended_at)}
      </Typography>
    ),
  },

  // Started At — when the thread was created.
  {
    accessorKey: "created_at",
    header: "Started",
    cell: ({ row }) => (
      <Typography variant="muted" as="span" className="whitespace-nowrap">
        {formatTime(row.original.created_at)}
      </Typography>
    ),
  },
];
