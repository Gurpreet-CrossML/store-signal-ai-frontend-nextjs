"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconDotsVertical,
  IconEye,
  IconMail,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import type { EmailTemplate } from "@/redux/api-slice/campaign-slice";

export function getEmailTemplateColumns(
  onView: (template: EmailTemplate) => void,
  onEdit: (template: EmailTemplate) => void,
  onDelete: (template: EmailTemplate) => void,
  onToggleActive: (template: EmailTemplate, checked: boolean) => void,
): ColumnDef<EmailTemplate>[] {
  return [
    {
      accessorKey: "name",
      header: "Template Name",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex items-center gap-2.5 py-1 font-medium">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {template.icon ? (
                <span className="text-sm">{template.icon}</span>
              ) : (
                <IconMail className="size-4" />
              )}
            </div>
            <span className="truncate" title={template.name}>
              {template.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span
          className="max-w-[240px] truncate text-sm text-muted-foreground"
          title={row.original.subject}
        >
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: "accent_color",
      header: "Accent",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <div
            className="size-4 rounded-full border"
            style={{ backgroundColor: row.original.accent_color }}
          />
          <span className="text-xs text-muted-foreground">
            {row.original.accent_color}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <Switch
            checked={template.is_active}
            onCheckedChange={(checked) => onToggleActive(template, checked)}
            aria-label={`Toggle ${template.name} active`}
            onClick={(event) => event.stopPropagation()}
          />
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Preview ${template.name}`}
              onClick={(event) => {
                event.stopPropagation();
                onView(template);
              }}
            >
              <IconEye className="size-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${template.name}`}
                  onClick={(event) => event.stopPropagation()}
                >
                  <IconDotsVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit(template);
                  }}
                >
                  <IconPencil className="size-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(template);
                  }}
                >
                  <IconTrash className="size-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
