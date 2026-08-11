"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { IconPencil, IconTrash } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Typography } from "@/components/ui/typography";
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
      cell: ({ row }) => (
        <span className="flex items-center gap-2 font-medium">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          {row.original.name}
        </span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.original.description;
        if (!description) {
          return <Typography variant="muted">—</Typography>;
        }

        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="max-w-xs cursor-default truncate">{description}</p>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="wrap-break-word whitespace-normal">{description}</p>
            </TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
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
      ),
    },
  ];
}
