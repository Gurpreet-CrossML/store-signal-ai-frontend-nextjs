"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { IconLock, IconPencil, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Typography } from "@/components/ui/typography";
import { ExpandableText } from "@/components/custom/expandable-text";
import { TagBadge } from "@/components/custom/helpdesk/tag-badge";
import type { SupportTicketTagData } from "@/redux/api-slice/support-ticket-slice";

export function getTagColumns({
  onEdit,
  onRemove,
}: {
  onEdit: (tag: SupportTicketTagData) => void;
  onRemove: (tag: SupportTicketTagData) => void;
}): ColumnDef<SupportTicketTagData>[] {
  return [
    {
      accessorKey: "name",
      header: "Tag",
      // A floor on the width, and padding for the longest names, keep clear
      // space between the chip and the description beside it.
      meta: { cellClassName: "min-w-60 pr-10" },
      // The table gives the name its full width; the default cap is for chips
      // squeezed into a row of other tags.
      cell: ({ row }) => <TagBadge tag={row.original} className="max-w-none" />,
    },
    {
      accessorKey: "description",
      header: "Description",
      // w-full takes whatever width the other columns leave; max-w-0 lets the
      // text truncate to that width instead of stretching the column.
      meta: { cellClassName: "w-full max-w-0" },
      cell: ({ row }) => {
        const description = row.original.description;
        if (!description) {
          return <Typography variant="muted">—</Typography>;
        }

        return <ExpandableText text={description} className="max-w-full" />;
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        // A predefined tag is managed by the platform, so there is nothing
        // for the store to edit or delete.
        if (row.original.is_predefined) {
          return (
            <div className="flex items-center justify-end">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <IconLock className="size-3.5" aria-hidden />
              </span>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={() => onEdit(row.original)}
              aria-label={`Edit ${row.original.name}`}
            >
              <IconPencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={() => onRemove(row.original)}
              aria-label={`Delete ${row.original.name}`}
            >
              <IconTrash className="size-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
