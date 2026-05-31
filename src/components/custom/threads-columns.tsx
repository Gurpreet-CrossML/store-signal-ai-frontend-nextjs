"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import type { Thread } from "@/redux/api-slice/thread-slice";

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
  const [expanded, setExpanded] = useState(false);

  if (!tags || tags.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const visible = expanded ? tags : tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenCount = tags.length - MAX_VISIBLE_TAGS;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((tag) => (
        <Badge key={tag} variant="secondary" className="font-normal">
          {tag}
        </Badge>
      ))}

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="cursor-pointer"
        >
          <Badge
            variant="outline"
            className="font-normal hover:bg-accent"
          >
            +{hiddenCount} more
          </Badge>
        </button>
      )}

      {expanded && tags.length > MAX_VISIBLE_TAGS && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="cursor-pointer"
        >
          <Badge variant="outline" className="font-normal hover:bg-accent">
            Show less
          </Badge>
        </button>
      )}
    </div>
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
          {id.slice(0, 8)}
        </span>
      );
    },
  },

  // Customer — name as primary text, email as sub-text.
  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const name = row.original.name;
      return (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">
            {name || "Anonymous"}
          </span>
          {/*
            Email sub-text — NOT yet returned by the API.
            Uncomment once `email` is present on the Thread type.

            <span className="text-xs text-muted-foreground">
              {row.original.email || "—"}
            </span>
          */}
        </div>
      );
    },
  },

  /*
  // Store — NOT yet returned by the API. Uncomment when available.
  {
    accessorKey: "store",
    header: "Store",
    cell: ({ row }) => {
      const store = row.original.store;
      const label = typeof store === "string" ? store : store?.name;
      return <span className="text-foreground">{label || "—"}</span>;
    },
  },
  */

  /*
  // Tags — NOT yet returned by the API. Uncomment when `tags: string[]` exists.
  // Uses the TagsCell above (badges, max 2 visible, "+N more" to expand).
  {
    accessorKey: "tags",
    header: "Tags",
    enableSorting: false,
    cell: ({ row }) => <TagsCell tags={row.original.tags ?? []} />,
  },
  */

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

  /*
  // Last Message — NOT yet returned by the API. Uncomment when available.
  {
    accessorKey: "last_message",
    header: "Last Message",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatDateTime(row.original.last_message)}
      </span>
    ),
  },
  */

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
