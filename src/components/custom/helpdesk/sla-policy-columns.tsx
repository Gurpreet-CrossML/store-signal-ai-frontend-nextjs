"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { IconPencil, IconTrash } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import { formatDate } from "@/lib/helpers";
import { formatMinutes } from "@/lib/sla";
import type { SlaPolicy } from "@/redux/api-slice/sla-policy-slice";

/** A target in the table: its length, or a dash when the policy sets none. */
function targetCell(minutes: number | null) {
  if (!minutes) return <Typography variant="muted">—</Typography>;
  return <span className="whitespace-nowrap">{formatMinutes(minutes)}</span>;
}

export function getSlaPolicyColumns({
  onEdit,
  onRemove,
}: {
  onEdit: (policy: SlaPolicy) => void;
  onRemove: (policy: SlaPolicy) => void;
}): ColumnDef<SlaPolicy>[] {
  return [
    {
      id: "tag",
      header: "Tag",
      meta: { cellClassName: "w-[20%] min-w-48 pr-4" },
      cell: ({ row }) => (
        <TagBadge
          tag={{
            name: row.original.tag_name,
            color: row.original.tag_color,
            description: "",
          }}
          className="max-w-none"
        />
      ),
    },
    {
      accessorKey: "priority_order",
      header: "Priority",
      meta: { cellClassName: "w-[9%] min-w-20" },
      cell: ({ row }) => (
        <span className="whitespace-nowrap font-medium">
          P{row.original.priority_order}
        </span>
      ),
    },
    {
      accessorKey: "first_reply_minutes",
      header: "First reply",
      meta: { cellClassName: "w-[12%] min-w-24" },
      cell: ({ row }) => targetCell(row.original.first_reply_minutes),
    },
    {
      accessorKey: "every_reply_minutes",
      header: "Every reply",
      meta: { cellClassName: "w-[12%] min-w-24" },
      cell: ({ row }) => targetCell(row.original.every_reply_minutes),
    },
    {
      accessorKey: "resolution_minutes",
      header: "Resolution",
      meta: { cellClassName: "w-[12%] min-w-24" },
      cell: ({ row }) => targetCell(row.original.resolution_minutes),
    },
    {
      accessorKey: "is_active",
      header: "Status",
      meta: { cellClassName: "w-[11%] min-w-24" },
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "secondary" : "outline"}>
          {row.original.is_active ? "Active" : "Paused"}
        </Badge>
      ),
    },
    {
      accessorKey: "updated_at",
      header: "Updated At",
      meta: { cellClassName: "w-[14%] min-w-32" },
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.updated_at)}
        </span>
      ),
    },
    {
      id: "actions",
      // The buttons sit at the right edge, so the heading does too.
      header: () => <div className="text-right">Action</div>,
      meta: { cellClassName: "w-[10%] min-w-24" },
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => onEdit(row.original)}
            aria-label={`Edit SLA policy of ${row.original.tag_name}`}
          >
            <IconPencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 text-destructive hover:text-destructive"
            onClick={() => onRemove(row.original)}
            aria-label={`Delete SLA policy of ${row.original.tag_name}`}
          >
            <IconTrash className="size-4" />
          </Button>
        </div>
      ),
    },
  ];
}
