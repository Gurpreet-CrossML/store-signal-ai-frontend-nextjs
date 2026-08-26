"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  IconCopy,
  IconDotsVertical,
  IconEye,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  WhatsAppTemplateCategoryBadge,
  WhatsAppTemplateQualityBadge,
  WhatsAppTemplateStatusBadge,
} from "@/components/ui/status-badge";
import type { WhatsAppTemplate } from "@/redux/api-slice/social-ai-slice";
import { resolveTemplateIcon } from "./whatsapp-template-helpers";

function copyTemplateId(id: string) {
  navigator.clipboard
    .writeText(id)
    .then(() => toast.success("Template ID copied"))
    .catch(() => toast.error("Couldn't copy the template ID"));
}

/**
 * A factory rather than a static array: unlike the read-only account
 * columns, a row's view action opens the caller's own preview panel, so the
 * click handler has to come from the screen that owns that panel's state.
 */
export function getWhatsAppTemplateColumns(
  onView: (template: WhatsAppTemplate) => void,
  onEdit: (template: WhatsAppTemplate) => void,
  onDelete: (template: WhatsAppTemplate) => void,
): ColumnDef<WhatsAppTemplate>[] {
  return [
    {
      accessorKey: "name",
      header: "Template Name",
      cell: ({ row }) => {
        const template = row.original;
        const Icon = resolveTemplateIcon(template);
        return (
          <div className="flex items-center gap-2.5 py-1 font-medium">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
            </div>
            <span className="truncate" title={template.name}>
              {template.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <WhatsAppTemplateCategoryBadge category={row.original.category} />
      ),
    },
    {
      accessorKey: "language",
      header: "Language",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.language}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <WhatsAppTemplateStatusBadge status={row.original.status} />
      ),
    },
    {
      // Meta exposes no created/updated timestamp on a template — quality is
      // the one other signal Meta computes over its lifetime, so it fills
      // this column instead of a date the API can't actually supply.
      id: "quality",
      header: "Quality",
      cell: ({ row }) => (
        <WhatsAppTemplateQualityBadge
          score={row.original.quality_score?.score}
        />
      ),
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
                    copyTemplateId(template.id);
                  }}
                >
                  <IconCopy className="size-4" />
                  Copy Template ID
                </DropdownMenuItem>
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
